// Башня героев: правила, этажи, противники и сам бой. Чистые функции без базы и сети: бот считает
// по ним результат, оверлей проигрывает те же ходы, а баланс можно прогнать скриптом.
// Числа - первая версия из docs/IDEAS.md; урон и защита врага в IDEAS не заданы, это допущение.
import { getHeroById, getHeroStats, HEROES, type HeroStats } from './heroes';
import { getBossById } from './bosses';
import { currentBonus, type TowerBonus } from './towerBonus';

export const TOWER_CONFIG = {
  // ВРЕМЕННО 100 на время тестов; рабочее значение 5 (см. обсуждение с владельцем)
  ATTEMPTS_PER_DAY: 100,
  BOSS_EVERY: 5,
  // Пауза после последнего удара, пока играет падение и показывается итог
  END_PAUSE_MS: 1700,
  // Тот же бой вызывает следующий через эту паузу
  GAP_MS: 600,
} as const;

// Босс этажа: этаж -> id босса. Больше боссов - больше этажей: башня кончается на последнем боссе.
export const BOSS_FLOORS: Readonly<Record<number, string>> = {
  5: 'pirate_zombie',
  10: 'squidman',
  15: 'pirate_leader',
  20: 'aztec_leader',
  25: 'maya_leader',
  30: 'nordic_leader',
  35: 'boar_king',
  40: 'shaman_king',
  45: 'devil_leader',
};

export const TOWER_FLOORS = Math.max(...Object.keys(BOSS_FLOORS).map(Number));

// Босс-этаж по счёту, а не по каталогу: кривую сложности можно проверить на всех 45 этажах
export const isBossFloor = (floor: number): boolean => floor > 0 && floor % TOWER_CONFIG.BOSS_EVERY === 0;

// Оттенки «вражеских» героев по кругу этажей, чтобы соперник отличался от героя зрителя
const ENEMY_TINTS = [0xff9a9a, 0x9ad0ff, 0xc9ff9a, 0xe0a0ff] as const;

export type TowerEnemy = {
  kind: 'hero' | 'boss';
  // id героя (assets/heroes/<id>) или босса (assets/bosses/<id>)
  spriteId: string;
  name: string;
  tint: number | null;
  stats: { health: number; attack: number; defense: number; speed: number };
};

const ENEMY_SPEED = 0.9;

// Статы врага зависят только от этажа: «Тук» на этаже 7 не равен Туку зрителя с 50 уровнем
export const enemyStats = (floor: number): TowerEnemy['stats'] => {
  const boss = isBossFloor(floor);
  // Кривая подобрана так, чтобы герой 50 уровня доходил до 45 этажа, а ранние боссы были стеной
  const health = 60 * 1.022 ** floor * (boss ? 1.35 : 1);
  const attack = (8 + 2.2 * floor) * (boss ? 1.4 : 1);
  const defense = (2 + 0.58 * floor) * (boss ? 1.4 : 1);
  return {
    health: Math.round(health),
    attack: Math.round(attack * 100) / 100,
    defense: Math.round(defense * 100) / 100,
    speed: ENEMY_SPEED,
  };
};

export const getEnemy = (floor: number): TowerEnemy => {
  const stats = enemyStats(floor);
  const bossId = BOSS_FLOORS[floor];
  if (bossId) {
    const boss = getBossById(bossId);
    if (!boss) throw new Error(`Босс "${bossId}" этажа ${floor} нет в каталоге`);
    return { kind: 'boss', spriteId: boss.id, name: boss.name, tint: null, stats };
  }
  // Обычные этажи: герои каталога по кругу. Новый герой магазина сам встаёт в ротацию
  const hero = HEROES[(floor - 1) % HEROES.length];
  if (!hero) throw new Error('В каталоге нет героев для соперников башни');
  return { kind: 'hero', spriteId: hero.id, name: hero.name, tint: ENEMY_TINTS[(floor - 1) % ENEMY_TINTS.length] ?? null, stats };
};

export type TowerTurn = {
  by: 'hero' | 'enemy';
  damage: number;
  // Здоровье обеих сторон ПОСЛЕ удара
  heroHp: number;
  enemyHp: number;
};

export type TowerFight = {
  won: boolean;
  heroMaxHp: number;
  enemyMaxHp: number;
  turns: TowerTurn[];
  // id бонуса, по которому считался бой
  bonus: string;
};

// Урон: атака минус половина защиты цели, не меньше 1. Скорость - сколько ударов в единицу времени
const damageOf = (attack: number, targetDefense: number): number => Math.max(1, Math.round((attack - targetDefense / 2) * 100) / 100);

const MAX_TURNS = 200;

export const simulateFight = (
  heroId: string,
  level: number,
  floor: number,
  bonus: TowerBonus = currentBonus(),
): TowerFight => {
  const base: HeroStats = getHeroStats(heroId, level);
  const hero = {
    health: Math.round(base.health * (bonus.hero.health ?? 1)),
    attack: base.attack * (bonus.hero.attack ?? 1),
    defense: base.defense * (bonus.hero.defense ?? 1),
    speed: base.speed * (bonus.hero.speed ?? 1),
  };
  const raw = enemyStats(floor);
  const enemy = {
    ...raw,
    health: Math.round(raw.health * (bonus.enemy.health ?? 1)),
    defense: raw.defense * (bonus.enemy.defense ?? 1),
  };
  const heroDamage = damageOf(hero.attack, enemy.defense);
  const enemyDamage = damageOf(enemy.attack, hero.defense);

  let heroHp = hero.health;
  let enemyHp = enemy.health;
  let heroCharge = 0;
  let enemyCharge = 0;
  const turns: TowerTurn[] = [];

  // Заряд копится со скоростью; кто набрал единицу, бьёт. Герой ходит первым при равенстве
  while (turns.length < MAX_TURNS) {
    heroCharge += hero.speed;
    enemyCharge += enemy.speed;
    while (heroCharge >= 1 || enemyCharge >= 1) {
      const heroActs = heroCharge >= 1 && heroCharge >= enemyCharge;
      if (heroActs) {
        heroCharge -= 1;
        enemyHp = Math.max(0, Math.round((enemyHp - heroDamage) * 100) / 100);
        turns.push({ by: 'hero', damage: heroDamage, heroHp, enemyHp });
        if (enemyHp <= 0) return { won: true, heroMaxHp: hero.health, enemyMaxHp: enemy.health, turns, bonus: bonus.id };
      } else {
        enemyCharge -= 1;
        heroHp = Math.max(0, Math.round((heroHp - enemyDamage) * 100) / 100);
        turns.push({ by: 'enemy', damage: enemyDamage, heroHp, enemyHp });
        if (heroHp <= 0) return { won: false, heroMaxHp: hero.health, enemyMaxHp: enemy.health, turns, bonus: bonus.id };
      }
    }
  }
  return { won: false, heroMaxHp: hero.health, enemyMaxHp: enemy.health, turns, bonus: bonus.id };
};

// Награда за первое прохождение этажа (из IDEAS): монеты платятся один раз на зрителя, опыт герою - всегда
export const floorCoins = (floor: number): number => 20 + 8 * floor;
export const floorXp = (floor: number): number => 10 + 3 * floor;
// За поражение героя тоже учат: треть опыта этажа, чтобы упёршийся в босса герой всё же рос
export const lossXp = (floor: number): number => Math.max(1, Math.round(floorXp(floor) / 3));

// Сколько опыта до следующего уровня героя. В IDEAS не задано, это допущение (50 на уровень)
export const heroXpToNext = (level: number): number => 50 * level;

export const applyHeroXp = (
  level: number,
  xp: number,
  gain: number,
  maxLevel: number,
): { level: number; xp: number; levelsGained: number } => {
  let nextLevel = level;
  let nextXp = xp + gain;
  while (nextLevel < maxLevel && nextXp >= heroXpToNext(nextLevel)) {
    nextXp -= heroXpToNext(nextLevel);
    nextLevel += 1;
  }
  return { level: nextLevel, xp: nextLevel >= maxLevel ? 0 : nextXp, levelsGained: nextLevel - level };
};

// Попытки сбрасываются раз в сутки по местной дате машины, на которой работает бот
export const dayKey = (date: Date = new Date()): string => {
  const pad = (n: number): string => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

export const attemptsLeft = (used: number, usedDay: string, today: string = dayKey()): number =>
  Math.max(0, TOWER_CONFIG.ATTEMPTS_PER_DAY - (usedDay === today ? used : 0));

// Тайминги проигрывания: одни и те же числа знают и бот (когда писать в чат и пускать следующего),
// и оверлей (сколько играть). Удар и ответная реакция идут встык.
export const TURN_MS = 620;
export const INTRO_MS = 500;
export const fightDurationMs = (turnCount: number): number =>
  INTRO_MS + turnCount * TURN_MS + TOWER_CONFIG.END_PAUSE_MS;

export const heroName = (heroId: string): string => getHeroById(heroId).name;
