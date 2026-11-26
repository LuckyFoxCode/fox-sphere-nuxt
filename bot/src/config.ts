// Переменные окружения бота. dev:bot запускается через dotenv-cli и берёт .env.development.
const need = (name: string): string => {
  const value = process.env[name];
  if (!value) throw new Error(`${name} не задан (см. .env.example)`);
  return value;
};

export const config = {
  enabled: process.env.BOT_ENABLED === 'true',
  // pnpm start:bot задаёт NODE_ENV=production
  isProduction: process.env.NODE_ENV === 'production',
  channelName: () => need('TWITCH_CHANNEL_NAME').toLowerCase(),
  clientId: () => need('TWITCH_CLIENT_ID'),
  clientSecret: () => need('TWITCH_CLIENT_SECRET'),
  // Пусто — бот возьмёт единственный токен из таблицы TwitchToken
  botId: process.env.TWITCH_BOT_ID ?? '',
  streamerId: process.env.TWITCH_USER_ID ?? '',
  // dev — "!t" (!tcoins, !tprofile), prod — "!": тестовый бот не пересекается со старым в одном чате.
  // Значение берётся из COMMAND_PREFIX; если не задано, по умолчанию безопасный "!t",
  // и только NODE_ENV=production даёт "!".
  prefix: process.env.COMMAND_PREFIX || (process.env.NODE_ENV === 'production' ? '!' : '!t'),
  // Лотерея: менять ли VIP на самом Twitch. По умолчанию только в prod: dev-база — копия боевой, и
  // розыгрыш в ней иначе снимал бы и выдавал настоящие VIP зрителям канала. Включить в dev: true
  lotteryTwitchVip: process.env.LOTTERY_TWITCH_VIP
    ? process.env.LOTTERY_TWITCH_VIP === 'true'
    : process.env.NODE_ENV === 'production',
  // Nuxt крутится на порту из OVERLAY_URL, там же живёт /auth/twitch/login
  loginUrl: `${process.env.OVERLAY_URL || 'http://localhost:3001'}/auth/twitch/login`,
};
