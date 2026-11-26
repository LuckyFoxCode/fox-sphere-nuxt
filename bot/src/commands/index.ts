import { pickProfileBadges, resolveAchievements } from '../../../shared/achievements';
import { getLevelRange } from '../../../shared/xp';
import { loadAchievementCounters } from '../achievements';
import { prisma } from '../db';
import { getActiveHeroId } from '../heroes';
import { messages } from '../language';
import { emitEvent } from '../socket';
import { registerXpBoostCommand } from './boost';
import { registerFishCommand } from './fish';
import { registerHeroCommands } from './hero';
import { registerLotteryCommands, type LotteryDeps } from './lottery';
import { registerPivoCommand } from './pivo';
import { registerVipCommands, type VipDeps } from './vip';
import { CommandRegistry } from './registry';
import { registerSpinCommands, type SpinDeps } from './spin';
import { registerTimerCommands } from './timer';
import { createTextCommands } from './text';

export const createRegistry = (deps: SpinDeps & Omit<VipDeps, 'prefix'> & Omit<LotteryDeps, 'prefix'>) => {
  const registry = new CommandRegistry(deps.prefix);

  registerSpinCommands(registry, deps);
  registerFishCommand(registry, deps);
  registerPivoCommand(registry);
  registerHeroCommands(registry, deps.prefix);
  registerVipCommands(registry, deps);
  registerLotteryCommands(registry, deps);
  registerXpBoostCommand(registry, deps.prefix);
  registerTimerCommands(registry, deps.prefix);

  registry.register({
    name: 'coins',
    aliases: ['balance', 'монеты'],
    cooldownMs: 5000,
    run: async ({ viewer, displayName, reply }) => {
      await reply(messages().coins(displayName, viewer.coins));
    },
  });

  // Карточка на оверлее: герой, уровень, статы и самые редкие ачивки. В чат ничего не пишем: смотреть её на стриме
  registry.register({
    name: 'profile',
    aliases: ['профиль'],
    cooldownMs: 10_000,
    run: async ({ viewer, displayName, color, roles }) => {
      const { startXp, maxXp } = getLevelRange(viewer.lvl);
      const [counters, heroId] = await Promise.all([loadAchievementCounters(viewer), getActiveHeroId(viewer.id)]);
      const hero = await prisma.viewerHero.findUnique({ where: { viewerId_heroId: { viewerId: viewer.id, heroId } } });
      const earned = resolveAchievements(counters);
      emitEvent('profile:show', {
        userId: viewer.twitchId,
        username: viewer.username,
        displayName,
        color,
        lvl: viewer.lvl,
        xp: viewer.xp,
        startXp,
        maxXp,
        coins: viewer.coins,
        heroId,
        heroLevel: hero?.level ?? 1,
        bestStreak: counters.bestStreak > 0 ? counters.bestStreak : null,
        goldenBeers: viewer.goldenBeers,
        isBroadcaster: roles.isBroadcaster,
        isMod: roles.isMod,
        isFounder: viewer.isFounder,
        isSubscriber: roles.isSubscriber,
        isVip: roles.isVip,
        // Как в чате: VIP из базы и из лотереи — один и тот же «постоянный» VIP
        isPermanentVip: viewer.isPermanentVip || viewer.isLuckyVip,
        isLuckyVip: viewer.isLuckyVip,
        isFollower: roles.isFollower,
        badges: pickProfileBadges(earned),
        earned: earned.length,
      });
    },
  });

  // Текстовые команды из БД — после кодовых: имя из кода не перекрывается
  registry.setFallback(createTextCommands(deps.prefix));

  return registry;
};
