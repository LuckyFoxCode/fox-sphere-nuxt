// !addvip (алиас !vip) и !removevip (алиас !rvip): названия, алиасы, права (стример или модератор),
// общий кулдаун 10 с и тексты — из старого fox-sphere. Новое по сравнению со старым: если Twitch
// уже знает нужный статус, команда не падает, а просто приводит базу в порядок; об отказе Twitch
// бот пишет в чат (раньше молчал).
import type { ApiClient } from '@twurple/api';
import { codeCommand } from '../../../shared/commands';
import { messages } from '../language';
import { emitEvent } from '../socket';
import { setPermanentVip } from '../vip';
import type { CommandRegistry } from './registry';
import type { CommandContext } from './types';

const VIP_COOLDOWN_MS = 10_000;

export type VipDeps = {
  prefix: string;
  api: ApiClient;
  // Канал (TWITCH_USER_ID): VIP выдаётся от его имени
  streamerId: string;
  // true, когда токен стримера есть (права channel:manage:vips)
  ensureBroadcaster: () => Promise<boolean>;
};

type Mode = 'add' | 'remove';

export const registerVipCommands = (registry: CommandRegistry, deps: VipDeps): void => {
  const { prefix, api, streamerId, ensureBroadcaster } = deps;

  const run = (mode: Mode, commandName: string) => async (ctx: CommandContext) => {
    const { displayName, roles, reply } = ctx;
    const t = messages().vip;

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

      if (!streamerId || !(await ensureBroadcaster())) {
        throw new Error('нет токена стримера (откройте /auth/twitch/broadcaster/login)');
      }

      // Спрашиваем Twitch заранее: «уже VIP» и «не VIP» — не ошибки, база должна просто совпасть
      const isVipNow = await api.asUser(streamerId, (c) => c.channels.checkVipForUser(streamerId, user.id));
      if (mode === 'add' && !isVipNow) {
        await api.asUser(streamerId, (c) => c.channels.addVip(streamerId, user.id));
      } else if (mode === 'remove' && isVipNow) {
        await api.asUser(streamerId, (c) => c.channels.removeVip(streamerId, user.id));
      }

      await setPermanentVip(user.id, user.name, mode === 'add');
      console.log(`[vip] ${displayName}: ${mode === 'add' ? 'выдал' : 'снял'} VIP ${user.name}`);

      if (mode === 'add') {
        await reply(t.added(displayName, user.name));
        // После ответа: если чат не принял строку, оверлей не покажет алерт, которого никто не видел
        emitEvent('twitch:add-vip', { userId: user.id, username: user.name });
      } else {
        await reply(t.removed(displayName, user.name));
      }
    } catch (error) {
      console.error(`[vip] ${commandName} ${target} не удалась:`, error);
      ctx.releaseCooldown();
      await reply(t.failed(displayName));
    }
  };

  registry.register({
    ...codeCommand('addvip'),
    cooldownMs: VIP_COOLDOWN_MS,
    cooldownScope: 'global',
    run: run('add', 'addvip'),
  });

  registry.register({
    ...codeCommand('removevip'),
    cooldownMs: VIP_COOLDOWN_MS,
    cooldownScope: 'global',
    run: run('remove', 'removevip'),
  });
};
