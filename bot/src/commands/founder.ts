// !addfounder и !removefounder: выдача и снятие статуса основателя (бонус XP). Права и кулдаун
// те же, что у !addvip: стример или модератор, общий кулдаун 10 с. Twitch ничего не меняется,
// только база, поэтому токен стримера не нужен.
import type { ApiClient } from '@twurple/api';
import { codeCommand } from '../../../shared/commands';
import { setFounder } from '../founder';
import { messages } from '../language';
import type { CommandRegistry } from './registry';
import type { CommandContext } from './types';

const FOUNDER_COOLDOWN_MS = 10_000;

export type FounderDeps = {
  prefix: string;
  api: ApiClient;
};

type Mode = 'add' | 'remove';

export const registerFounderCommands = (registry: CommandRegistry, deps: FounderDeps): void => {
  const { prefix, api } = deps;

  const run = (mode: Mode, commandName: string) => async (ctx: CommandContext) => {
    const { displayName, roles, reply } = ctx;
    const t = messages().founder;

    if (!roles.isBroadcaster && !roles.isMod) {
      // Общий кулдаун не должен достаться отказу: иначе зритель блокирует команду модератору
      ctx.releaseCooldown();
      await reply(t.denied(displayName));
      return;
    }

    const target = ctx.args[0]?.replace(/^@/, '').trim();
    if (!target) {
      ctx.releaseCooldown();
      await reply(t.usage(displayName, prefix, commandName));
      return;
    }

    try {
      const user = await api.users.getUserByName(target);
      if (!user) {
        ctx.releaseCooldown();
        await reply(t.notFound(target));
        return;
      }

      await setFounder(user.id, user.name, mode === 'add');
      console.log(`[founder] ${displayName}: ${mode === 'add' ? 'выдал' : 'снял'} founder ${user.name}`);
      await reply(mode === 'add' ? t.added(displayName, user.name) : t.removed(displayName, user.name));
    } catch (error) {
      console.error(`[founder] ${commandName} ${target} не удалась:`, error);
      ctx.releaseCooldown();
      await reply(t.failed(displayName));
    }
  };

  registry.register({
    ...codeCommand('addfounder'),
    cooldownMs: FOUNDER_COOLDOWN_MS,
    cooldownScope: 'global',
    run: run('add', 'addfounder'),
  });

  registry.register({
    ...codeCommand('removefounder'),
    cooldownMs: FOUNDER_COOLDOWN_MS,
    cooldownScope: 'global',
    run: run('remove', 'removefounder'),
  });
};
