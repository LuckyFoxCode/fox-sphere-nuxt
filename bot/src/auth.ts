import { ApiClient } from '@twurple/api';
import { RefreshingAuthProvider } from '@twurple/auth';
import { scopesFor } from '../../shared/twitch';
import { config } from './config';
import { prisma } from './db';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Бот без TWITCH_BOT_ID — это аккаунт стримера (так же решает Nuxt при входе).
// Если не заданы оба id, берём единственный токен из таблицы.
const botTokenWhere = () => {
  const id = config.botId || config.streamerId;
  return id ? { twitchUserId: id } : undefined;
};

const waitForToken = async () => {
  let warned = false;
  for (;;) {
    const where = botTokenWhere();
    const row = where
      ? await prisma.twitchToken.findUnique({ where })
      : await prisma.twitchToken.findFirst();
    if (row) return row;
    if (!warned) {
      console.log(`[bot] токена нет. Авторизуйте бота: откройте ${config.loginUrl} (аккаунт бота).`);
      warned = true;
    }
    await sleep(5000);
  }
};

const toTokenData = (row: {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  obtainmentTimestamp: bigint;
}, scope: string[]) => ({
  accessToken: row.accessToken,
  refreshToken: row.refreshToken,
  expiresIn: row.expiresIn,
  obtainmentTimestamp: Number(row.obtainmentTimestamp),
  scope,
});

export const createAuth = async () => {
  const authProvider = new RefreshingAuthProvider({
    clientId: config.clientId(),
    clientSecret: config.clientSecret(),
  });

  // Twitch ротирует refresh-токен: каждое обновление (бота и стримера) обязано попасть в базу
  authProvider.onRefresh(async (userId, token) => {
    await prisma.twitchToken.update({
      where: { twitchUserId: userId },
      data: {
        accessToken: token.accessToken,
        refreshToken: token.refreshToken ?? undefined,
        expiresIn: token.expiresIn ?? 0,
        obtainmentTimestamp: BigInt(token.obtainmentTimestamp),
      },
    });
    console.log(`[bot] токен ${userId} обновлён`);
  });
  authProvider.onRefreshFailure((userId) => {
    console.error(`[bot] не удалось обновить токен ${userId}: авторизуйте аккаунт заново (${config.loginUrl})`);
  });

  const row = await waitForToken();
  const botUserId = row.twitchUserId;
  const botIsStreamer = botUserId === config.streamerId;
  await authProvider.addUser(
    botUserId,
    toTokenData(row, scopesFor('bot', config.botId, config.streamerId)),
    ['chat'],
  );

  const api = new ApiClient({ authProvider });

  // Токен стримера (/auth/twitch/broadcaster/login) для Helix-запросов, которым нужны права владельца
  // канала. Если бот и стример — один аккаунт, это тот же токен. Иначе подхватываем строку позже,
  // когда её создадут, перезапуск не нужен.
  let broadcasterReady = botIsStreamer;
  let lastTry = 0;
  const ensureBroadcaster = async (): Promise<boolean> => {
    if (broadcasterReady) return true;
    if (!config.streamerId || Date.now() - lastTry < 60_000) return false;
    lastTry = Date.now();
    const broadcasterRow = await prisma.twitchToken.findUnique({
      where: { twitchUserId: config.streamerId },
    });
    if (!broadcasterRow) return false;
    await authProvider.addUser(
      config.streamerId,
      toTokenData(broadcasterRow, scopesFor('broadcaster', config.botId, config.streamerId)),
      [],
    );
    broadcasterReady = true;
    console.log('[bot] токен стримера найден, Helix-запросы от его имени включены');
    return true;
  };
  await ensureBroadcaster();

  return { authProvider, api, botUserId, ensureBroadcaster };
};
