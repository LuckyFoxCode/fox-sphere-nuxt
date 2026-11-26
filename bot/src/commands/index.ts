import { getLevelRange } from '../../../shared/xp';
import { prisma } from '../db';
import { messages } from '../language';
import { registerFishCommand } from './fish';
import { registerPivoCommand } from './pivo';
import { registerVipCommands, type VipDeps } from './vip';
import { CommandRegistry } from './registry';
import { registerSpinCommands, type SpinDeps } from './spin';
import { createTextCommands } from './text';

export const createRegistry = (deps: SpinDeps & Omit<VipDeps, 'prefix'>) => {
  const registry = new CommandRegistry(deps.prefix);

  registerSpinCommands(registry, deps);
  registerFishCommand(registry, deps);
  registerPivoCommand(registry);
  registerVipCommands(registry, deps);

  registry.register({
    name: 'coins',
    aliases: ['balance', 'монеты'],
    cooldownMs: 5000,
    run: async ({ viewer, displayName, reply }) => {
      await reply(messages().coins(displayName, viewer.coins));
    },
  });

  registry.register({
    name: 'profile',
    aliases: ['профиль'],
    cooldownMs: 10_000,
    run: async ({ viewer, displayName, reply }) => {
      const { startXp, maxXp } = getLevelRange(viewer.lvl);
      const rank =
        (await prisma.viewer.count({ where: { xp: { gt: viewer.xp } } })) + 1;
      await reply(
        messages().profile(displayName, {
          lvl: viewer.lvl,
          xp: viewer.xp - startXp,
          xpToNext: maxXp - startXp,
          coins: viewer.coins,
          rank,
        }),
      );
    },
  });

  // Текстовые команды из БД — после кодовых: имя из кода не перекрывается
  registry.setFallback(createTextCommands(deps.prefix));

  return registry;
};
