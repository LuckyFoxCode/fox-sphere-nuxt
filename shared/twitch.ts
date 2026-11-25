// Права OAuth. Таблица TwitchToken не хранит scope, поэтому и Nuxt (логин), и бот (загрузка токена)
// берут списки отсюда. Права запрашиваются в ссылке авторизации, в консоли dev.twitch.tv их не настраивают.
export type TokenRole = 'bot' | 'broadcaster';

// Аккаунт бота. Для анонсов и шаутаутов бот к тому же должен быть модератором канала (/mod).
export const BOT_SCOPES = [
  'chat:read',
  'chat:edit',
  'moderator:manage:announcements', // цветные анонсы в чате
  'moderator:manage:shoutouts', // шаутаут (например, рейдеру)
  'user:bot', // аккаунт может действовать в чате как бот
];

// Аккаунт стримера. Список из старого fox-sphere (twitch-auth.factory.ts) + moderator:read:followers
// (в старом проекте фолловеров проверял бот-модератор, здесь это делает токен стримера).
export const BROADCASTER_SCOPES = [
  'moderator:read:followers', // статус фолловера: +2 XP за сообщение. Нужен уже сейчас
  'channel:bot', // стример разрешает боту действовать в чате своего канала
  'bits:read', // cheer и Bits
  'channel:read:subscriptions', // подписки и подарки
  'moderation:read', // списки модераторов/VIP
  'channel:read:redemptions', // награды за баллы канала
  'channel:read:hype_train', // Hype Train
  'channel:manage:broadcast', // смена названия и категории
  'channel:manage:redemptions', // подтверждение/возврат наград
  'channel:manage:polls', // опросы
  'channel:manage:predictions', // предсказания
  'channel:manage:moderators', // управление модераторами
  'channel:read:vips', // список VIP
  'channel:manage:vips', // выдача и снятие VIP
];

// Одна строка TwitchToken на аккаунт. Если бот и стример — один аккаунт (TWITCH_BOT_ID пуст
// или равен TWITCH_USER_ID), любой вход должен просить права обеих ролей сразу,
// иначе второй вход затрёт первый токен с меньшим набором прав.
export const isSameAccount = (botId: string, userId: string): boolean =>
  userId !== '' && (botId === '' || botId === userId);

export const scopesFor = (role: TokenRole, botId: string, userId: string): string[] =>
  isSameAccount(botId, userId)
    ? [...BOT_SCOPES, ...BROADCASTER_SCOPES]
    : role === 'bot'
      ? BOT_SCOPES
      : BROADCASTER_SCOPES;
