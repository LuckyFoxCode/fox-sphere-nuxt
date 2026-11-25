// Команды рулетки: !spin и !spinstats. Тексты, алиасы и кулдауны — из старого fox-sphere.
import type { ChatAnnounceColor, RouletteSpinResultPayload } from '../../../shared/events';
import { ROULETTE_PRICE, SPIN_COOLDOWN_MS, SPIN_STATS_COOLDOWN_MS } from '../../../shared/roulette';
import { getJackpot } from '../bank';
import { emitEvent } from '../socket';
import { NotEnoughCoinsError, runSpin } from '../roulette';
import type { PlaySpin } from '../spinStage';
import type { CommandRegistry } from './registry';
import type { CommandContext } from './types';

export type SpinDeps = {
  prefix: string;
  playSpin: PlaySpin;
  // false — анонс не ушёл (нет прав): тогда тот же текст пишется обычным сообщением
  announce: (text: string, color: ChatAnnounceColor) => Promise<boolean>;
  // XP-приз зрителю и стриму: начисляет сразу, а возвращает показ (оверлей, level-up в чат),
  // который вызывается, когда лента встала
  awardPrizeXp: (ctx: CommandContext, xp: number) => Promise<() => Promise<void>>;
};

const resultMessage = (name: string, result: RouletteSpinResultPayload): string | null => {
  switch (result.prizeType) {
    case 'coins':
      return `💰 @${name} fished out ${result.coinAmount} coins!`;
    case 'xp':
      return `⚡ @${name} grabbed ${result.xpAmount} XP!`;
    // Пустой результат в чат не идёт: его показывает лента на оверлее
    case 'empty':
    case 'jackpot':
      return null;
  }
};

export const registerSpinCommands = (registry: CommandRegistry, deps: SpinDeps): void => {
  const { prefix, playSpin, announce, awardPrizeXp } = deps;

  // В момент остановки ленты: банк в шапке, ответ в чат и показ XP
  const onStop = async (
    ctx: CommandContext,
    result: RouletteSpinResultPayload,
    showXp: (() => Promise<void>) | null,
  ) => {
    try {
      emitEvent('stream:jackpot-updated', await getJackpot());
    } catch (error) {
      console.error('[spin] не удалось показать банк:', error);
    }

    if (result.jackpotWon) {
      const headline = `👑 @${ctx.displayName} HITS THE JACKPOT!`;
      if (!(await announce(headline, 'blue'))) await ctx.reply(headline);
      await ctx.reply(
        `🎰 @${ctx.displayName} takes ${result.coinAmount} jackpot coins! Bank updated: ${result.jackpotTotalAfter}`,
      );
      return;
    }

    const message = resultMessage(ctx.displayName, result);
    if (message) await ctx.reply(message);
    await showXp?.();
  };

  registry.register({
    name: 'spin',
    aliases: ['roll', 'спин', 'лудка'],
    cooldownMs: SPIN_COOLDOWN_MS,
    cooldownMessage: (name, seconds) => `⏳ @${name}, not so fast! ${prefix}spin again in ${seconds}s`,
    run: async (ctx) => {
      const { viewer, displayName, reply, releaseCooldown } = ctx;
      if (viewer.coins < ROULETTE_PRICE) {
        releaseCooldown();
        await reply(`@${displayName}, not enough coins: you need ${ROULETTE_PRICE}, you have ${viewer.coins}`);
        return;
      }

      let showXp: (() => Promise<void>) | null = null;

      // Остановку ленты не ждём: XP за это же сообщение не должен зависеть от очереди вращений
      void playSpin(
        async () => {
          const result = await runSpin({ viewerId: viewer.id, twitchId: viewer.twitchId, username: displayName });
          console.log(
            `[spin] ${displayName}: ${result.prizeType}, монет ${result.coinAmount}, XP ${result.xpAmount}, ` +
              `банк после спина ${result.jackpotTotalAfter}`,
          );
          if (result.xpAmount > 0) {
            // Спин уже оплачен и сыгран: сбой начисления XP не должен его отменять (как в старом боте)
            showXp = await awardPrizeXp(ctx, result.xpAmount).catch((error: unknown) => {
              console.error(`[spin] XP-приз для ${displayName} не начислен:`, error);
              return null;
            });
          }
          return result;
        },
        (result) => onStop(ctx, result, showXp),
      ).catch((error: unknown) => {
        releaseCooldown();
        // Монеты потратили, пока спин ждал очереди: как в старом боте, только запись в лог
        if (error instanceof NotEnoughCoinsError) console.warn(`[spin] ${error.message}`);
        else console.error(`[spin] спин ${displayName} не завершён:`, error);
      });
    },
  });

  registry.register({
    name: 'spinstats',
    cooldownMs: SPIN_STATS_COOLDOWN_MS,
    run: async ({ viewer, displayName, reply }) => {
      if (viewer.spinsCount === 0) {
        await reply(`@${displayName}, you haven't spun yet — hit ${prefix}spin! 🎰`);
        return;
      }
      await reply(
        `🎰 @${displayName}: spun ${viewer.spinsCount} times, won ${viewer.totalWin}, lost ${viewer.totalLoss}`,
      );
    },
  });
};
