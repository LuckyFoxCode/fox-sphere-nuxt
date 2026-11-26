// Лотерея VIP: недельный XP, билеты и сам розыгрыш (правила — shared/lottery.ts).
// Сцена на оверлее и сообщения в чат живут в commands/lottery.ts; здесь только база и выбор.
import { randomInt, randomUUID } from 'node:crypto';
import type { Viewer } from '../../generated/prisma/client';
import type { LotteryDrawPayload } from '../../shared/events';
import type { Lang } from '../../shared/i18n';
import { LOTTERY_CONFIG, LOTTERY_ENTRIES_MAX } from '../../shared/lottery';
import { prisma } from './db';

export type LotteryPerson = { twitchId: string; username: string };

// Перемешивание Фишера — Йетса; `random(max)` — целое в [0, max), в бою криптостойкое
export const shuffle = <T>(items: readonly T[], random: (max: number) => number = randomInt): T[] => {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = random(i + 1);
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
};

// Когда зритель в последний раз получал недельный XP. В памяти: перезапуск бота кулдаун обнуляет
const lastWeeklyXpAt = new Map<string, number>();

export type TicketResult = 'cooldown' | 'skipped' | 'progress' | 'ticket';

// Недельный XP за сообщение: +1 не чаще раза в 5 с; постоянным VIP, стримеру и боту билет не нужен
// (стримера и бота отсеивает вызывающий). `ticket` — этим сообщением билет получен.
export const awardLotteryXp = async (viewer: Viewer, now = Date.now()): Promise<TicketResult> => {
  if (viewer.isPermanentVip) return 'skipped';
  if (now - (lastWeeklyXpAt.get(viewer.twitchId) ?? 0) < LOTTERY_CONFIG.XP_COOLDOWN_MS) return 'cooldown';
  lastWeeklyXpAt.set(viewer.twitchId, now);

  const updated = await prisma.viewer.update({
    where: { id: viewer.id },
    data: { xpThisWeek: { increment: LOTTERY_CONFIG.XP_PER_MESSAGE } },
  });
  if (updated.hasTicket || updated.xpThisWeek < LOTTERY_CONFIG.TICKET_XP_THRESHOLD) return 'progress';

  // Условие в самом запросе: два сообщения подряд не выдадут билет дважды
  const { count } = await prisma.viewer.updateMany({
    where: { id: viewer.id, hasTicket: false },
    data: { hasTicket: true },
  });
  return count > 0 ? 'ticket' : 'progress';
};

// Зритель с билетом: постоянному VIP билет не нужен, поэтому в розыгрыше его нет
const SELECT_PERSON = { twitchId: true, username: true } as const;

export const getTicketHolders = (): Promise<LotteryPerson[]> =>
  prisma.viewer.findMany({ where: { hasTicket: true }, select: SELECT_PERSON, orderBy: { id: 'asc' } });

export type DrawOutcome =
  | { kind: 'empty'; oldWinners: LotteryPerson[] }
  | {
      kind: 'drawn';
      oldWinners: LotteryPerson[];
      winners: (LotteryPerson & { returning: boolean })[];
      participants: LotteryPerson[];
    };

// Розыгрыш: выбирает победителей и одним действием меняет базу, как в старом боте: прошлые победители
// теряют isLuckyVip, новые получают, недельный XP и билеты обнуляются у ВСЕХ (и у не выигравших).
// Постоянные VIP в участники не попадают. Без участников база всё равно сбрасывается.
export const runDraw = async (random: (max: number) => number = randomInt): Promise<DrawOutcome> => {
  const oldWinners = await prisma.viewer.findMany({ where: { isLuckyVip: true }, select: SELECT_PERSON });
  const participants = await prisma.viewer.findMany({
    where: { hasTicket: true, isPermanentVip: false },
    select: SELECT_PERSON,
    orderBy: { id: 'asc' },
  });

  const picked = shuffle(participants, random).slice(0, LOTTERY_CONFIG.WINNERS_COUNT);
  const winnerIds = picked.map((person) => person.twitchId);

  await prisma.$transaction([
    prisma.viewer.updateMany({ where: { isLuckyVip: true }, data: { isLuckyVip: false } }),
    prisma.viewer.updateMany({ where: { twitchId: { in: winnerIds } }, data: { isLuckyVip: true } }),
    prisma.viewer.updateMany({ data: { xpThisWeek: 0, hasTicket: false } }),
  ]);

  if (picked.length === 0) return { kind: 'empty', oldWinners };

  const wasWinner = new Set(oldWinners.map((person) => person.twitchId));
  return {
    kind: 'drawn',
    oldWinners,
    winners: picked.map((person) => ({ ...person, returning: wasWinner.has(person.twitchId) })),
    participants,
  };
};

// Что уходит на оверлей: победители по местам и выборка имён для ленты. Ленте нужны не все участники
// (их может быть сотни), поэтому выборка ограничена; число участников приходит отдельно
export const buildDrawPayload = (
  outcome: Extract<DrawOutcome, { kind: 'drawn' }>,
  lang: Lang,
  random: (max: number) => number = randomInt,
): LotteryDrawPayload => ({
  id: randomUUID(),
  total: outcome.participants.length,
  entries: shuffle(outcome.participants, random)
    .slice(0, LOTTERY_ENTRIES_MAX)
    .map((person) => person.username),
  winners: outcome.winners.map((winner) => ({
    userId: winner.twitchId,
    username: winner.username,
    returning: winner.returning,
  })),
  lang,
});
