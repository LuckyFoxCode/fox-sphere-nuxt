// Счётчики ачивок зрителя (shared/achievements.ts). Ничего не хранится отдельно: спины и пиво лежат в
// Viewer, стрик в WatchStreak, а призы рулетки считаются по CoinHistory.
import type { Viewer } from '../../generated/prisma/client';
import { ACHIEVEMENT_COIN_RECORDS, towerCounters, type AchievementCounters } from '../../shared/achievements';
import { prisma } from './db';

export const loadAchievementCounters = async (
  viewer: Pick<Viewer, 'id' | 'spinsCount' | 'goldenBeers' | 'towerBest'>,
): Promise<AchievementCounters> => {
  const count = (record: keyof typeof ACHIEVEMENT_COIN_RECORDS) =>
    prisma.coinHistory.count({ where: { viewerId: viewer.id, ...ACHIEVEMENT_COIN_RECORDS[record] } });
  const [jackpots, prize500, prize1000, streak, heroes] = await Promise.all([
    count('jackpots'),
    count('prize500'),
    count('prize1000'),
    prisma.watchStreak.aggregate({ where: { viewerId: viewer.id }, _max: { streakValue: true } }),
    prisma.viewerHero.findMany({ where: { viewerId: viewer.id }, select: { level: true, towerFloor: true } }),
  ]);
  return {
    spins: viewer.spinsCount,
    jackpots,
    prize500,
    prize1000,
    bestStreak: streak._max.streakValue ?? 0,
    goldenBeers: viewer.goldenBeers,
    ...towerCounters(viewer.towerBest, heroes),
  };
};
