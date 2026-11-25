// Права OAuth. Таблица TwitchToken не хранит scope, поэтому и Nuxt (логин), и бот (загрузка токена)
// берут списки отсюда. Права запрашиваются в ссылке авторизации, в консоли dev.twitch.tv их не настраивают.
export type TokenRole = 'bot' | 'broadcaster';

export const BOT_SCOPES = ['chat:read', 'chat:edit'];

// Аккаунт стримера. Список из старого fox-sphere (twitch-auth.factory.ts) + moderator:read:followers
// (в старом проекте фолловеров проверял бот-модератор, здесь это делает токен стримера).
export const BROADCASTER_SCOPES = [
  'moderator:read:followers', // статус фолловера: +2 XP за сообщение. Нужен уже сейчас
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
