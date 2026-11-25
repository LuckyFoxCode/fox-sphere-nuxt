// Переменные окружения бота. dev:bot запускается через dotenv-cli и берёт .env.development.
const need = (name: string): string => {
  const value = process.env[name];
  if (!value) throw new Error(`${name} не задан (см. .env.example)`);
  return value;
};

export const config = {
  enabled: process.env.BOT_ENABLED === 'true',
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
  // Nuxt крутится на порту из OVERLAY_URL, там же живёт /auth/twitch/login
  loginUrl: `${process.env.OVERLAY_URL || 'http://localhost:3001'}/auth/twitch/login`,
};
