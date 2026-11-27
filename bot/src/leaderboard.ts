import { LEADERBOARD_TOP } from '../../shared/economy';
import type { LeaderboardEntryPayload, LeaderboardShowPayload } from '../../shared/events';
import type { Viewer } from '../../generated/prisma/client';
import { config } from './config';
import { prisma } from './db';

// Стример и сам бот в зачёт не идут: у них XP не про игру зрителей
const excludedIds = (): string[] => [config.streamerId, config.botId].filter((id) => id !== '');

const toEntry = (viewer: Viewer, rank: number): LeaderboardEntryPayload => ({
  rank,
  userId: viewer.twitchId,
  username: viewer.username,
  lvl: viewer.lvl,
  xp: viewer.xp,
});

// Место зрителя по XP. Тот же порядок, что в выборке топа: равный XP делит место по id
export const rankOf = async (viewer: Viewer): Promise<number> =>
  1 +
  (await prisma.viewer.count({
    where: {
      twitchId: { notIn: excludedIds() },
      OR: [{ xp: { gt: viewer.xp } }, { xp: viewer.xp, id: { lt: viewer.id } }],
    },
  }));

// Топ по XP. Если активировавший вне топа, его строка идёт отдельно с настоящим местом
export const buildLeaderboard = async (requester: Viewer, requesterName: string): Promise<LeaderboardShowPayload> => {
  const notIn = excludedIds();
  const top = await prisma.viewer.findMany({
    where: { twitchId: { notIn }, xp: { gt: 0 } },
    orderBy: [{ xp: 'desc' }, { id: 'asc' }],
    take: LEADERBOARD_TOP,
  });
  const entries = top.map((viewer, index) => toEntry(viewer, index + 1));

  let you: LeaderboardEntryPayload | null = null;
  if (!notIn.includes(requester.twitchId) && !top.some((viewer) => viewer.id === requester.id)) {
    you = toEntry(requester, await rankOf(requester));
  }
  return { requesterId: requester.twitchId, requesterName, entries, you };
};
