// Башня героев: бой, награды и прогресс в базе, плюс очередь на оверлее. Правила и числа живут в
// shared/tower.ts; здесь только запись результата и порядок показа. На экране идёт один бой за раз.
import { getHeroById } from '../../shared/heroes';
import type { TowerFightPayload } from '../../shared/events';
import {
  applyHeroXp,
  attemptsLeft,
  dayKey,
  fightDurationMs,
  floorCoins,
  floorXp,
  getEnemy,
  simulateFight,
  TOWER_CONFIG,
  TOWER_FLOORS,
  type TowerFight,
} from '../../shared/tower';
import { prisma } from './db';
import { getActiveHeroId } from './heroes';
import { emitEvent } from './socket';

export type TowerOutcome =
  | { status: 'no-attempts' }
  | { status: 'complete' }
  | {
      status: 'fought';
      heroId: string;
      level: number;
      floor: number;
      fight: TowerFight;
      coins: number;
      xp: number;
      // Новый уровень героя, если он вырос
      levelUp: number | null;
      left: number;
    };

// Одной транзакцией: попытка тратится, при победе героя двигаем этаж, опыт и (раз на зрителя) монеты
export const runTowerFight = async (viewerId: number): Promise<TowerOutcome> => {
  const heroId = await getActiveHeroId(viewerId);
  const today = dayKey();

  return prisma.$transaction(async (tx): Promise<TowerOutcome> => {
    const viewer = await tx.viewer.findUniqueOrThrow({ where: { id: viewerId } });
    if (attemptsLeft(viewer.towerAttemptsUsed, viewer.towerAttemptsDay, today) <= 0) return { status: 'no-attempts' };

    const row = await tx.viewerHero.findUniqueOrThrow({ where: { viewerId_heroId: { viewerId, heroId } } });
    const floor = row.towerFloor + 1;
    if (floor > TOWER_FLOORS) return { status: 'complete' };

    const fight = simulateFight(heroId, row.level, floor);
    const usedToday = (viewer.towerAttemptsDay === today ? viewer.towerAttemptsUsed : 0) + 1;
    let coins = 0;
    let xp = 0;
    let levelUp: number | null = null;

    if (fight.won) {
      xp = floorXp(floor);
      const grown = applyHeroXp(row.level, row.xp, xp, getHeroById(heroId).maxLevel);
      await tx.viewerHero.update({
        where: { id: row.id },
        data: { towerFloor: floor, level: grown.level, xp: grown.xp },
      });
      if (grown.levelsGained > 0) levelUp = grown.level;

      // Монеты платятся за этаж один раз на зрителя: второй герой на уже оплаченном этаже получает только опыт
      if (floor > viewer.towerBest) {
        coins = floorCoins(floor);
        await tx.coinHistory.create({
          data: { viewerId, amount: coins, reason: 'TOWER_REWARD', details: `Floor ${floor}: ${heroId}` },
        });
      }
    }

    await tx.viewer.update({
      where: { id: viewerId },
      data: {
        towerAttemptsUsed: usedToday,
        towerAttemptsDay: today,
        ...(coins > 0 ? { coins: { increment: coins }, towerBest: floor } : {}),
      },
    });

    return {
      status: 'fought',
      heroId,
      level: row.level,
      floor,
      fight,
      coins,
      xp,
      levelUp,
      left: attemptsLeft(usedToday, today, today),
    };
  });
};

// Быстрая проверка перед постановкой в очередь, чтобы не занимать место тому, у кого нет попыток
export const hasTowerAttempts = async (viewerId: number): Promise<boolean> => {
  const viewer = await prisma.viewer.findUniqueOrThrow({
    where: { id: viewerId },
    select: { towerAttemptsUsed: true, towerAttemptsDay: true },
  });
  return attemptsLeft(viewer.towerAttemptsUsed, viewer.towerAttemptsDay) > 0;
};

type QueueEntry = {
  viewerId: number;
  twitchId: string;
  displayName: string;
  // Пишем в чат итог после показа боя
  announce: (outcome: TowerOutcome) => Promise<void>;
};

const queue: QueueEntry[] = [];
let running = false;
// Чей бой идёт сейчас: он уже вышел из очереди, но второй раз вставать ему рано
let currentTwitchId: string | null = null;
let fightSeq = 0;

const wait = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

export const isQueued = (twitchId: string): boolean =>
  currentTwitchId === twitchId || queue.some((entry) => entry.twitchId === twitchId);

// Место в очереди, считая текущий бой (1 - следующий после идущего показа, либо сразу)
export const enqueueTower = (entry: QueueEntry): number => {
  queue.push(entry);
  void drain();
  return queue.length + (running ? 1 : 0);
};

const toPayload = (entry: QueueEntry, outcome: Extract<TowerOutcome, { status: 'fought' }>): TowerFightPayload => {
  const hero = getHeroById(outcome.heroId);
  const enemy = getEnemy(outcome.floor);
  return {
    id: ++fightSeq,
    userId: entry.twitchId,
    displayName: entry.displayName,
    heroId: outcome.heroId,
    level: outcome.level,
    floor: outcome.floor,
    won: outcome.fight.won,
    hero: { name: hero.name, maxHp: outcome.fight.heroMaxHp },
    enemy: { kind: enemy.kind, spriteId: enemy.spriteId, name: enemy.name, maxHp: outcome.fight.enemyMaxHp, tint: enemy.tint },
    turns: outcome.fight.turns,
    bonus: outcome.fight.bonus,
    queued: queue.map((next) => next.displayName),
  };
};

const drain = async (): Promise<void> => {
  if (running) return;
  running = true;
  try {
    for (let entry = queue.shift(); entry; entry = queue.shift()) {
      currentTwitchId = entry.twitchId;
      try {
        const outcome = await runTowerFight(entry.viewerId);
        if (outcome.status === 'fought') {
          emitEvent('tower:fight', toPayload(entry, outcome));
          console.log(
            `[tower] ${entry.displayName}: ${outcome.heroId} L${outcome.level}, этаж ${outcome.floor}, ${outcome.fight.won ? 'победа' : 'поражение'}`,
          );
          await wait(fightDurationMs(outcome.fight.turns.length));
        }
        await entry.announce(outcome);
      } catch (error) {
        console.error(`[tower] ${entry.displayName}: ошибка боя`, error);
      }
      await wait(TOWER_CONFIG.GAP_MS);
    }
  } finally {
    running = false;
    currentTwitchId = null;
  }
};
