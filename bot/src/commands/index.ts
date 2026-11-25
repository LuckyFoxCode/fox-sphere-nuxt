import { getLevelRange } from '../../../shared/xp';
import { prisma } from '../db';
import { CommandRegistry } from './registry';

export const createRegistry = (prefix: string) => {
  const registry = new CommandRegistry(prefix);

  registry.register({
    name: 'coins',
    aliases: ['balance', 'монеты'],
    cooldownMs: 5000,
    run: async ({ viewer, displayName, reply }) => {
      await reply(`@${displayName}, у тебя ${viewer.coins} монет`);
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
        `@${displayName}: уровень ${viewer.lvl}, XP ${viewer.xp - startXp}/${maxXp - startXp} ` +
          `до следующего, монет ${viewer.coins}, место в топе #${rank}`,
      );
    },
  });

  return registry;
};
