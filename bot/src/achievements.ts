// Счётчики ачивок зрителя (shared/achievements.ts). Ничего не хранится отдельно: спины и пиво лежат в
// Viewer, стрик в WatchStreak, а призы рулетки считаются по CoinHistory. Приз ровно 500 или 1000
// бывает только у сегментов coins500 и coins1000 (рыбалка столько не даёт), джекпот пишется своей причиной.
import type { Viewer } from '../../generated/prisma/client';
import type { AchievementCounters } from '../../shared/achievements';
import { prisma } from './db';

export const loadAchievementCounters = async (
  viewer: Pick<Viewer, 'id' | 'spinsCount' | 'goldenBeers'>,
): Promise<AchievementCounters> => {
  const [jackpots, prize500, prize1000, streak] = await Promise.all([
    prisma.coinHistory.count({ where: { viewerId: viewer.id, reason: 'JACKPOT' } }),
    prisma.coinHistory.count({ where: { viewerId: viewer.id, reason: 'SPIN_PRIZE', amount: 500 } }),
    prisma.coinHistory.count({ where: { viewerId: viewer.id, reason: 'SPIN_PRIZE', amount: 1000 } }),
    prisma.watchStreak.aggregate({ where: { viewerId: viewer.id }, _max: { streakValue: true } }),
  ]);
  return {
    spins: viewer.spinsCount,
    jackpots,
    prize500,
    prize1000,
    bestStreak: streak._max.streakValue ?? 0,
    goldenBeers: viewer.goldenBeers,
  };
};
