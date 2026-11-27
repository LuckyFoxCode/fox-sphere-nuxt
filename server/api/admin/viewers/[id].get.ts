// Один зритель подробно: игры, счётчики ачивок, стрики, герои и все операции с монетами.
import { ACHIEVEMENT_COIN_RECORDS } from '../../../../shared/achievements';
import { HEROES } from '../../../../shared/heroes';
import type { AdminViewerDetails } from '../../../../shared/viewers';

export default defineAdminHandler(async (event): Promise<AdminViewerDetails> => {
  const id = Number(getRouterParam(event, 'id'));
  const viewer =
    Number.isSafeInteger(id) && id > 0
      ? await prisma.viewer.findUnique({
          where: { id },
          include: {
            heroes: { orderBy: { createdAt: 'asc' } },
            coinHistory: { orderBy: [{ createdAt: 'desc' }, { id: 'desc' }] },
            watchStreaks: { orderBy: [{ createdAt: 'desc' }, { streakValue: 'desc' }] },
          },
        })
      : null;
  if (!viewer) {
    throw createError({ statusCode: 404, statusMessage: 'Unknown viewer', data: { error: 'Такого зрителя нет.' } });
  }

  const count = (key: keyof typeof ACHIEVEMENT_COIN_RECORDS) => {
    const filter: { reason: string; amount?: number } = ACHIEVEMENT_COIN_RECORDS[key];
    return viewer.coinHistory.filter(
      (record) => record.reason === filter.reason && (filter.amount === undefined || record.amount === filter.amount),
    ).length;
  };

  return {
    viewer: toAdminViewer(viewer),
    spinsCount: viewer.spinsCount,
    totalWin: viewer.totalWin,
    totalLoss: viewer.totalLoss,
    goldenBeers: viewer.goldenBeers,
    xpThisWeek: viewer.xpThisWeek,
    counters: {
      spins: viewer.spinsCount,
      jackpots: count('jackpots'),
      prize500: count('prize500'),
      prize1000: count('prize1000'),
      bestStreak: Math.max(0, ...viewer.watchStreaks.map((streak) => streak.streakValue)),
      goldenBeers: viewer.goldenBeers,
    },
    streaks: viewer.watchStreaks.map(({ streakValue, createdAt }) => ({
      value: streakValue,
      createdAt: createdAt.toISOString(),
    })),
    heroes: viewer.heroes.map((hero) => ({
      id: hero.heroId,
      name: HEROES.find((item) => item.id === hero.heroId)?.name ?? hero.heroId,
      level: hero.level,
      active: hero.isActive,
    })),
    history: viewer.coinHistory.map(({ id, amount, reason, createdAt }) => ({
      id,
      amount,
      reason,
      createdAt: createdAt.toISOString(),
    })),
  };
});
