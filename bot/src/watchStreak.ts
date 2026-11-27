// Награда за watch streak, как WatchStreakService в старом fox-sphere: рубежи 3, 5, 7 и каждый 5-й с 10.
// Рубеж, который зритель уже брал (запись в WatchStreak), платит вдвое меньше и новой записи не создаёт.
import { isWatchStreakRewardLevel, watchStreakReward } from '../../shared/economy';
import type { Viewer } from '../../generated/prisma/client';
import { prisma } from './db';

export type WatchStreakAward = {
  xp: number;
  coins: number;
  isRepeat: boolean;
};

const isUniqueViolation = (error: unknown): boolean =>
  error instanceof Error && 'code' in error && error.code === 'P2002';

const details = (streak: number): string => `Watch streak: ${streak} streams`;

// null — на этом значении награды нет. Монеты и история пишутся одной транзакцией; XP зрителю
// начисляет вызывающий через awardBonusXp (уровень пересчитывается там), запись в XpHistory — здесь.
export const awardWatchStreak = async (viewer: Viewer, streak: number): Promise<WatchStreakAward | null> => {
  if (!isWatchStreakRewardLevel(streak)) return null;

  const existing = await prisma.watchStreak.findUnique({
    where: { viewerId_streakValue: { viewerId: viewer.id, streakValue: streak } },
  });
  const isRepeat = existing !== null;
  const { xp, coins } = watchStreakReward(streak, isRepeat);

  try {
    await prisma.$transaction([
      ...(isRepeat ? [] : [prisma.watchStreak.create({ data: { viewerId: viewer.id, streakValue: streak } })]),
      prisma.viewer.update({ where: { id: viewer.id }, data: { coins: { increment: coins } } }),
      prisma.coinHistory.create({
        data: { viewerId: viewer.id, amount: coins, reason: 'WATCH_STREAK', details: details(streak) },
      }),
      prisma.xpHistory.create({
        data: { viewerId: viewer.id, amount: xp, reason: 'WATCH_STREAK', details: details(streak) },
      }),
    ]);
  } catch (error) {
    // Тот же рубеж пришёл дважды одновременно: второй раз ничего не платим, наклейка всё равно нужна
    if (isUniqueViolation(error)) return { xp: 0, coins: 0, isRepeat: true };
    throw error;
  }
  return { xp, coins, isRepeat };
};
