// Зритель из базы в вид для админки. twitchId наружу не нужен.
import type { Viewer } from '../../generated/prisma/client';
import type { AdminViewer } from '../../shared/viewers';

export const toAdminViewer = (viewer: Viewer): AdminViewer => {
  const streamerId = process.env.TWITCH_USER_ID;
  const botId = process.env.TWITCH_BOT_ID;
  return {
    id: viewer.id,
    username: viewer.username,
    lvl: viewer.lvl,
    xp: viewer.xp,
    coins: viewer.coins,
    createdAt: viewer.createdAt.toISOString(),
    // Начало эпохи у новичка значит «XP за чат ещё не получал»
    lastXpAt: viewer.lastXpAt.getTime() > 0 ? viewer.lastXpAt.toISOString() : null,
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
