// !timer [минуты] [цвет] [название...] и !stoptimer: названия, алиасы, права (стример или
// модератор), цвета, значения по умолчанию (1 минута, blue, «Timer») и общий кулдаун 10 с — из
// старого fox-sphere. Новое: предел в сутки и ответ в чат при неверном времени (раньше бот
// отвечал не в тот адрес и молчал).
import { TIMER_CONFIG } from '../../../shared/economy';
import { TIMER_TITLE_MAX } from '../../../shared/events';
import { messages } from '../language';
import { DEFAULT_TIMER_COLOR, isTimerColor, startTimer, stopTimer } from '../streamTimer';
import type { CommandRegistry } from './registry';

const TIMER_COOLDOWN_MS = 10_000;

export const registerTimerCommands = (registry: CommandRegistry, prefix: string): void => {
  registry.register({
    name: 'timer',
    aliases: ['counter', 'таймер'],
    cooldownMs: TIMER_COOLDOWN_MS,
    cooldownScope: 'global',
    run: async ({ displayName, roles, args, reply, releaseCooldown }) => {
      const t = messages();
      if (!roles.isBroadcaster && !roles.isMod) {
        // Общий кулдаун не должен достаться отказу: иначе зритель блокирует команду модератору
        releaseCooldown();
        await reply(t.denied(displayName));
        return;
      }

      const minutes = Number(args[0] ?? TIMER_CONFIG.DEFAULT_MINUTES);
      if (!Number.isFinite(minutes) || minutes <= 0 || minutes > TIMER_CONFIG.MAX_MINUTES) {
        releaseCooldown();
        await reply(t.timer.usage(displayName, prefix));
        return;
      }

      const colorInput = args[1]?.toLowerCase();
      const color = colorInput && isTimerColor(colorInput) ? colorInput : DEFAULT_TIMER_COLOR;
      const title = args.slice(2).join(' ').slice(0, TIMER_TITLE_MAX) || 'Timer';

      await startTimer({ minutes, color, title });
      await reply(t.timer.started(displayName, minutes, title));
    },
  });

  registry.register({
    name: 'stoptimer',
    aliases: ['timer-remove', 'timer-stop', 'таймер-стоп'],
    cooldownMs: TIMER_COOLDOWN_MS,
    cooldownScope: 'global',
    run: async ({ displayName, roles, reply, releaseCooldown }) => {
      const t = messages();
      if (!roles.isBroadcaster && !roles.isMod) {
        // Общий кулдаун не должен достаться отказу: иначе зритель блокирует команду модератору
        releaseCooldown();
        await reply(t.denied(displayName));
        return;
      }
      await stopTimer();
      await reply(t.timer.stopped(displayName));
    },
  });
};
