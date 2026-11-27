import { messages } from '../language';
import { emitEvent } from '../socket';
import { registerXpBoostCommand } from './boost';
import { registerFishCommand } from './fish';
import { registerFounderCommands } from './founder';
import { registerHeroCommands } from './hero';
import { registerLotteryCommands, type LotteryRunner } from './lottery';
import { registerPivoCommand } from './pivo';
import { buildProfilePayload } from './profile';
import { registerVipCommands, type VipDeps } from './vip';
import { CommandRegistry } from './registry';
import { registerSpinCommands, type SpinDeps } from './spin';
import { registerTimerCommands } from './timer';
import { createTextCommands } from './text';

export const createRegistry = (deps: SpinDeps & Omit<VipDeps, 'prefix'> & { lottery: LotteryRunner }) => {
  const registry = new CommandRegistry(deps.prefix);

  registerSpinCommands(registry, deps);
  registerFishCommand(registry, deps);
  registerPivoCommand(registry);
  registerHeroCommands(registry, deps.prefix);
  registerVipCommands(registry, deps);
  registerFounderCommands(registry, deps);
  registerLotteryCommands(registry, deps.lottery);
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
      emitEvent('profile:show', await buildProfilePayload(viewer, { displayName, color, roles }));
    },
  });

  // Текстовые команды из БД — после кодовых: имя из кода не перекрывается
  registry.setFallback(createTextCommands(deps.prefix));

  return registry;
};
