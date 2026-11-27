import { COOLDOWNS, XP_REWARDS } from '../../shared/economy';
import { getXpThresholdForLevel } from '../../shared/xp';
import type { Viewer } from '../../generated/prisma/client';
import { prisma } from './db';
import { getActiveXpBoost } from './xpBoost';

// Роли приходят бейджами сообщения (без прав Helix); isFollower считается отдельно (followers.ts)
export type ChatRoles = {
  isMod: boolean;
  isSubscriber: boolean;
  isBroadcaster: boolean;
  isVip: boolean;
  isFollower: boolean;
};

// Зритель создаётся при первом сообщении; ник и роли обновляются на каждом.
// lastXpAt у новичка — начало эпохи, чтобы первое сообщение уже дало XP.
export const ensureViewer = (twitchId: string, username: string, roles: ChatRoles): Promise<Viewer> =>
  prisma.viewer.upsert({
    where: { twitchId },
    create: {
      twitchId,
      username,
      isMod: roles.isMod,
      isSubscriber: roles.isSubscriber,
      lastXpAt: new Date(0),
    },
    update: { username, isMod: roles.isMod, isSubscriber: roles.isSubscriber },
  });

export const xpForMessage = (viewer: Viewer, roles: ChatRoles): number => {
  // Как в старом боте: стример и сабы 3, фолловер 2, остальные 1
  const base = roles.isBroadcaster
    ? XP_REWARDS.BROADCASTER
    : roles.isSubscriber
      ? XP_REWARDS.SUBSCRIBER
      : roles.isFollower
        ? XP_REWARDS.FOLLOWER
        : XP_REWARDS.DEFAULT;
  // VIP: бейдж Twitch или ручные флаги в БД
  const vip = roles.isVip || viewer.isPermanentVip || viewer.isLuckyVip ? XP_REWARDS.VIP_BONUS : 0;
  const founder = viewer.isFounder ? XP_REWARDS.FOUNDER_BONUS : 0;
  return base + vip + founder;
};

export type XpResult =
  | { status: 'cooldown'; waitMs: number }
  | { status: 'awarded'; xp: number; totalXp: number; fromLvl: number; lvl: number; leveledUp: boolean };

// Кулдаун хранится в БД (lastXpAt), поэтому переживает перезапуск бота.
export const awardMessageXp = async (viewer: Viewer, roles: ChatRoles): Promise<XpResult> => {
  const now = Date.now();
  const waitMs = COOLDOWNS.XP_MESSAGE_COOLDOWN - (now - viewer.lastXpAt.getTime());
  if (waitMs > 0) return { status: 'cooldown', waitMs };

  // Буст множит итог целиком (роль + VIP + founder), как в старом боте; в `xp` ниже уже итог,
  // его же main отдаёт стриму
  const boost = await getActiveXpBoost();
  const xp = xpForMessage(viewer, roles) * (boost?.multiplier ?? 1);
  const updated = await prisma.viewer.update({
    where: { id: viewer.id },
    data: {
      xp: { increment: xp },
      lastXpAt: new Date(now),
    },
  });

  return { status: 'awarded', xp, totalXp: updated.xp, fromLvl: updated.lvl, ...(await applyLevel(updated)) };
};

// Поднимает уровень под накопленный XP; вниз уровень не опускается
const applyLevel = async (viewer: Viewer): Promise<{ lvl: number; leveledUp: boolean }> => {
  let lvl = viewer.lvl;
  while (viewer.xp >= getXpThresholdForLevel(lvl)) lvl++;
  if (lvl === viewer.lvl) return { lvl, leveledUp: false };
  // Условие по старому уровню: XP за сообщение и приз рулетки могут начисляться одновременно
  const { count } = await prisma.viewer.updateMany({
    where: { id: viewer.id, lvl: { lt: lvl } },
    data: { lvl },
  });
  return { lvl, leveledUp: count > 0 };
};

// Недельный XP лотереи считается отдельно (bot/src/lottery.ts, `awardLotteryXp`): 1 за сообщение раз
// в 5 с, без ролей и буста. Здесь его нет, иначе буст ×2 и роли ускоряли бы билеты.

// XP не за сообщение (приз рулетки): без надбавок за роли, кулдауна и XP недели, как в старом боте
export const awardBonusXp = async (
  viewerId: number,
  xp: number,
): Promise<{ xp: number; totalXp: number; fromLvl: number; lvl: number; leveledUp: boolean }> => {
  const updated = await prisma.viewer.update({ where: { id: viewerId }, data: { xp: { increment: xp } } });
  return { xp, totalXp: updated.xp, fromLvl: updated.lvl, ...(await applyLevel(updated)) };
};
