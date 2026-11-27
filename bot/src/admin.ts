// Действия пульта эфира: те же функции, что у команд чата (!xpboost, !runlottery), плюс тестовые алерты.
// Проверку сессии стримера делает Nuxt, проверку секрета и формы запроса — internal.ts.
import type { AdminStreamState } from '../../shared/admin';
import { BOOST_CONFIG } from '../../shared/economy';
import { emitTestEvent } from '../../shared/testEvents';
import type { LotteryRunner } from './commands/lottery';
import { config } from './config';
import { prisma } from './db';
import { AdminError, type AdminActions } from './internal';
import { language, messages } from './language';
import { getLotteryWinners, getTicketHolders } from './lottery';
import { emitEvent } from './socket';
import { activateXpBoost, cancelXpBoost, getActiveXpBoost } from './xpBoost';

// То, что есть только у включённого бота (BOT_ENABLED=true): чат Twitch и розыгрыш
export type LiveBot = {
  isChatConnected: () => boolean;
  say: (text: string) => Promise<void>;
  lottery: LotteryRunner;
};

export const createAdminActions = (live: () => LiveBot | null): AdminActions => {
  // Ник для фразы в чате, как у ответа на команду: из базы, иначе название канала
  const streamerName = async (): Promise<string> => {
    const viewer = config.streamerId
      ? await prisma.viewer.findUnique({ where: { twitchId: config.streamerId }, select: { username: true } })
      : null;
    return viewer?.username ?? config.channelName();
  };

  // В чат пишет только prod. Буст уже включён или выключен, поэтому сбой чата не делает действие неудачным
  const tellChat = async (text: (name: string) => string): Promise<void> => {
    const bot = live();
    if (!config.isProduction || !bot?.isChatConnected()) {
      console.log('[admin] сообщение о бусте в чат не отправляется (dev или бот не в чате)');
      return;
    }
    try {
      await bot.say(text(await streamerName()));
    } catch (error) {
      console.error('[admin] не удалось написать в чат:', error);
    }
  };

  return {
    getState: async (): Promise<AdminStreamState> => {
      const bot = live();
      const running = bot?.lottery.isRunning() ?? false;
      const [boost, tickets, winners] = await Promise.all([
        getActiveXpBoost(),
        getTicketHolders(),
        getLotteryWinners(),
      ]);
      return {
        botEnabled: bot !== null,
        chatConnected: bot?.isChatConnected() ?? false,
        production: config.isProduction,
        boost,
        lottery: {
          running,
          twitchVip: config.lotteryTwitchVip,
          tickets: tickets.map((person) => person.username),
          winners: running ? null : winners.map((person) => person.username),
        },
      };
    },

    setBoost: async (request) => {
      if (request.action === 'stop') {
        if (!(await getActiveXpBoost())) throw new AdminError(409, 'буст сейчас не идёт');
        await cancelXpBoost();
        console.log('[admin] буст XP выключен');
        await tellChat((name) => messages().xpBoost.cancelled(name));
        return;
      }
      await activateXpBoost(request.minutes);
      console.log(`[admin] буст XP включён на ${request.minutes} мин`);
      await tellChat((name) => messages().xpBoost.started(name, request.minutes, BOOST_CONFIG.MULTIPLIER));
    },

    runLottery: () => {
      const bot = live();
      if (!bot) throw new AdminError(409, 'бот выключен (BOT_ENABLED), розыгрыш запустить нельзя');
      // Розыгрыш меняет базу раньше, чем пишет в чат: без чата не начинаем
      if (!bot.isChatConnected()) throw new AdminError(409, 'бот ещё не подключён к чату, попробуйте через минуту');
      if (!bot.lottery.start()) throw new AdminError(409, 'розыгрыш уже идёт');
      console.log('[admin] запущен розыгрыш лотереи');
    },

    sendTest: (kind, username) => {
      emitTestEvent(emitEvent, kind, { username, lang: language(), prefix: config.prefix });
      console.log(`[admin] тестовый показ на оверлее: ${kind} (${username})`);
    },
  };
};
