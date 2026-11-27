// Зритель из базы в вид для админки. twitchId наружу не нужен.
import type { Viewer } from '../../generated/prisma/client';
import type { BotFollowers } from '../../shared/admin';
import type { AdminViewer } from '../../shared/viewers';

export type Followers = {
  // twitchId → с какого момента фолловит; null — узнать не удалось
  since: Map<string, string> | null;
  // Почему не удалось; пусто — всё хорошо
  problem: string;
};

// Фолловеры живут в Twitch, а не в базе: их отдаёт бот. Без него раздел работает, статус неизвестен
export const loadFollowers = async (): Promise<Followers> => {
  try {
    const { followers } = await callBot<BotFollowers>('/followers');
    return { since: new Map(followers.map((item) => [item.userId, item.followedAt])), problem: '' };
  } catch (error) {
    const problem = (error as { data?: { error?: string } }).data?.error ?? 'Бот не принял запрос.';
    return { since: null, problem };
  }
};

export const toAdminViewer = (viewer: Viewer, followers: Followers): AdminViewer => {
  const streamerId = process.env.TWITCH_USER_ID;
  const botId = process.env.TWITCH_BOT_ID;
  const followedAt = followers.since?.get(viewer.twitchId) ?? null;
  return {
    id: viewer.id,
    username: viewer.username,
    lvl: viewer.lvl,
    xp: viewer.xp,
    coins: viewer.coins,
    createdAt: viewer.createdAt.toISOString(),
    // Начало эпохи у новичка значит «XP за чат ещё не получал»
    lastXpAt: viewer.lastXpAt.getTime() > 0 ? viewer.lastXpAt.toISOString() : null,
    isFollower: followers.since ? followedAt !== null : null,
    followedAt,
    isStreamer: viewer.twitchId === streamerId,
    isBot: viewer.twitchId === botId && botId !== streamerId,
    isMod: viewer.isMod,
    isSubscriber: viewer.isSubscriber,
    isFounder: viewer.isFounder,
    isPermanentVip: viewer.isPermanentVip,
    isLuckyVip: viewer.isLuckyVip,
    hasTicket: viewer.hasTicket,
  };
};
