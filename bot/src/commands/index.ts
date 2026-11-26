import { pickProfileBadges, resolveAchievements } from '../../../shared/achievements';
import { getLevelRange } from '../../../shared/xp';
import { loadAchievementCounters } from '../achievements';
import { prisma } from '../db';
import { messages } from '../language';
import { emitEvent } from '../socket';
import { registerXpBoostCommand } from './boost';
import { registerFishCommand } from './fish';
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

  // Карточка на оверлее: уровень, место и самые редкие ачивки. В чат ничего не пишем: смотреть её на стриме
  registry.register({
    name: 'profile',
    aliases: ['профиль'],
    cooldownMs: 10_000,
    run: async ({ viewer, displayName }) => {
      const { startXp, maxXp } = getLevelRange(viewer.lvl);
      const [rank, counters] = await Promise.all([
        prisma.viewer.count({ where: { xp: { gt: viewer.xp } } }),
        loadAchievementCounters(viewer),
      ]);
      const earned = resolveAchievements(counters);
      emitEvent('profile:show', {
        userId: viewer.twitchId,
        username: displayName,
        lvl: viewer.lvl,
        xp: viewer.xp - startXp,
        xpToNext: maxXp - startXp,
        coins: viewer.coins,
        rank: rank + 1,
        badges: pickProfileBadges(earned),
        earned: earned.length,
      });
    },
  });

  // Текстовые команды из БД — после кодовых: имя из кода не перекрывается
  registry.setFallback(createTextCommands(deps.prefix));

  return registry;
};
