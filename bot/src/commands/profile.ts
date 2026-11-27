import { pickProfileBadges, resolveAchievements } from '../../../shared/achievements';
import type { ProfileShowPayload } from '../../../shared/events';
import { getLevelRange } from '../../../shared/xp';
import type { Viewer } from '../../../generated/prisma/client';
import { loadAchievementCounters } from '../achievements';
import { prisma } from '../db';
import { getActiveHeroId } from '../heroes';
import type { ChatRoles } from '../viewers';

// Карточка профиля для оверлея. Её строят `!profile` и награда «Check My Stats»: одна карточка, один код
export const buildProfilePayload = async (
  viewer: Viewer,
  who: { displayName: string; color: string; roles: ChatRoles },
): Promise<ProfileShowPayload> => {
  const { startXp, maxXp } = getLevelRange(viewer.lvl);
  const [counters, heroId] = await Promise.all([loadAchievementCounters(viewer), getActiveHeroId(viewer.id)]);
  const hero = await prisma.viewerHero.findUnique({ where: { viewerId_heroId: { viewerId: viewer.id, heroId } } });
  const earned = resolveAchievements(counters);
  return {
    userId: viewer.twitchId,
    username: viewer.username,
    displayName: who.displayName,
    color: who.color,
    lvl: viewer.lvl,
    xp: viewer.xp,
    startXp,
    maxXp,
    coins: viewer.coins,
    heroId,
    heroLevel: hero?.level ?? 1,
    bestStreak: counters.bestStreak > 0 ? counters.bestStreak : null,
    goldenBeers: viewer.goldenBeers,
    isBroadcaster: who.roles.isBroadcaster,
    isMod: who.roles.isMod,
    isFounder: viewer.isFounder,
    isSubscriber: who.roles.isSubscriber,
    isVip: who.roles.isVip,
    // Как в чате: VIP из базы и из лотереи — один и тот же «постоянный» VIP
    isPermanentVip: viewer.isPermanentVip || viewer.isLuckyVip,
    isLuckyVip: viewer.isLuckyVip,
    isFollower: who.roles.isFollower,
    badges: pickProfileBadges(earned),
    earned: earned.length,
  };
};
