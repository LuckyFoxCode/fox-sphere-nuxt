// !xpboost: названия, права (стример или модератор), диапазон 5-60 минут (по умолчанию 30),
// множитель ×2 и `off` / `cancel` — из старого fox-sphere. Кулдауна у старой команды не было;
// 3 с здесь только от двойной отправки.
import { BOOST_CONFIG } from '../../../shared/economy';
import { codeCommand } from '../../../shared/commands';
import { messages } from '../language';
import { activateXpBoost, cancelXpBoost, getActiveXpBoost } from '../xpBoost';
import type { CommandRegistry } from './registry';

export const registerXpBoostCommand = (registry: CommandRegistry, prefix: string): void => {
  registry.register({
    ...codeCommand('xpboost'),
    cooldownMs: 3000,
    cooldownScope: 'global',
    run: async ({ displayName, roles, args, reply, releaseCooldown }) => {
      const t = messages();
      if (!roles.isBroadcaster && !roles.isMod) {
        // Общий кулдаун не должен достаться отказу: иначе зритель блокирует команду модератору
        releaseCooldown();
        await reply(t.denied(displayName));
        return;
      }

      const raw = args[0]?.toLowerCase();
      if (raw === 'off' || raw === 'cancel') {
        if (!(await getActiveXpBoost())) {
          releaseCooldown();
          await reply(t.xpBoost.noActive(displayName));
          return;
        }
        await cancelXpBoost();
        await reply(t.xpBoost.cancelled(displayName));
        return;
      }

      const minutes = raw === undefined ? BOOST_CONFIG.DEFAULT_MINUTES : Number(raw);
      if (!Number.isFinite(minutes) || minutes < BOOST_CONFIG.MIN_MINUTES || minutes > BOOST_CONFIG.MAX_MINUTES) {
        releaseCooldown();
        await reply(t.xpBoost.usage(displayName, prefix, BOOST_CONFIG.MIN_MINUTES, BOOST_CONFIG.MAX_MINUTES));
        return;
      }

      // Запись раньше ответа: «включён» должно значить «сохранено и разослано»
      await activateXpBoost(minutes);
      await reply(t.xpBoost.started(displayName, minutes, BOOST_CONFIG.MULTIPLIER));
    },
  });
};
