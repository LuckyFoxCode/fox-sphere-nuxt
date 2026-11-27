// Twitch возвращает сюда `code`; меняем его на токен и кладём в TwitchToken.
// Роль (bot / broadcaster / admin) берём из cookie, выставленной при старте входа.
// Бот токен сам не получает: он читает эту таблицу и обновляет токен через RefreshingAuthProvider.
// Роль admin — вход в админку: токен не сохраняется (он без прав и затёр бы токен стримера),
// проверяется только Twitch ID, а ошибки показывает /admin/login.
import { isSameAccount } from '../../../../shared/twitch';

type TokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  scope: string[];
};
type ValidateResponse = { user_id: string; login: string };

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);

const page = (title: string, body: string) =>
  `<!doctype html><meta charset="utf-8"><title>${title}</title>` +
  `<body style="font-family:sans-serif;max-width:40rem;margin:3rem auto"><h1>${title}</h1><p>${body}</p>`;

export default defineEventHandler(async (event) => {
  setHeader(event, 'content-type', 'text/html; charset=utf-8');
  const query = getQuery(event);

  const expectedState = getCookie(event, 'twitch_oauth_state');
  const role = getCookie(event, 'twitch_oauth_role');
  deleteCookie(event, 'twitch_oauth_state', { path: '/auth/twitch' });
  deleteCookie(event, 'twitch_oauth_role', { path: '/auth/twitch' });
  const adminFailed = (reason: 'denied' | 'state' | 'setup' | 'twitch' | 'account') =>
    sendRedirect(event, `/admin/login?error=${reason}`);

  if (query.error) {
    if (role === 'admin') return adminFailed('denied');
    setResponseStatus(event, 400);
    return page('Twitch отказал', escapeHtml(String(query.error_description ?? query.error)));
  }

  // Без известной роли токен не сохраняем: токен входа в админку не должен попасть на место токена стримера
  if (!isLoginRole(role) || !expectedState || query.state !== expectedState || typeof query.code !== 'string') {
    if (role === 'admin') return adminFailed('state');
    setResponseStatus(event, 400);
    return page('Ошибка входа', 'Неверный state. Начните заново с /auth/twitch/login.');
  }

  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;
  const redirectUri = process.env.TWITCH_BOT_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) {
    if (role === 'admin') return adminFailed('setup');
    setResponseStatus(event, 500);
    return page('Ошибка настройки', 'Нет TWITCH_CLIENT_ID / TWITCH_CLIENT_SECRET / TWITCH_BOT_REDIRECT_URI.');
  }

  let token: TokenResponse;
  let who: ValidateResponse;
  try {
    token = await $fetch<TokenResponse>('https://id.twitch.tv/oauth2/token', {
      method: 'POST',
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code: query.code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    });
    who = await $fetch<ValidateResponse>('https://id.twitch.tv/oauth2/validate', {
      headers: { Authorization: `OAuth ${token.access_token}` },
    });
  } catch {
    if (role === 'admin') return adminFailed('twitch');
    setResponseStatus(event, 502);
    return page('Ошибка Twitch', 'Не удалось обменять код на токен. Проверьте Client ID/Secret и Redirect URL.');
  }

  if (role === 'admin') {
    if (!isAdminConfigured()) return adminFailed('setup');
    if (who.user_id !== allowedAdminId()) return adminFailed('account');
    await createAdminSession(event, { twitchId: who.user_id, login: who.login });
    return sendRedirect(event, '/admin');
  }

  const botId = process.env.TWITCH_BOT_ID ?? '';
  const userId = process.env.TWITCH_USER_ID ?? '';
  // Бот без TWITCH_BOT_ID — это аккаунт стримера (isSameAccount); отдельному боту нужен TWITCH_BOT_ID
  const expectedId = role === 'broadcaster' ? userId : botId || userId;
  if (expectedId && who.user_id !== expectedId) {
    setResponseStatus(event, 403);
    return page(
      'Не тот аккаунт',
      `Вы вошли как ${escapeHtml(who.login)} (${who.user_id}), а для роли «${role}» ожидается id ${expectedId} ` +
        `(${role === 'broadcaster' ? 'TWITCH_USER_ID' : 'TWITCH_BOT_ID или TWITCH_USER_ID'}). ` +
        'Выйдите из Twitch в браузере (или откройте окно инкогнито) и войдите нужным аккаунтом. ' +
        (role === 'bot' && !botId ? 'Если бот — отдельный аккаунт, впишите его id в TWITCH_BOT_ID. ' : ''),
    );
  }

  const data = {
    accessToken: token.access_token,
    refreshToken: token.refresh_token,
    expiresIn: token.expires_in,
    obtainmentTimestamp: BigInt(Date.now()),
  };
  await prisma.twitchToken.upsert({
    where: { twitchUserId: who.user_id },
    create: { twitchUserId: who.user_id, ...data },
    update: data,
  });

  const same = isSameAccount(botId, userId) && who.user_id === userId;
  const label = role === 'broadcaster' ? 'Стример авторизован' : 'Бот авторизован';
  return page(
    label,
    `Аккаунт: <b>${escapeHtml(who.login)}</b> (id ${who.user_id}). Токен сохранён в базе, окно можно закрыть. ` +
      (same ? 'Бот и стример — один аккаунт, токен получил права обеих ролей. ' : '') +
      (role === 'bot' && !botId && !userId
        ? `Если это ваш основной аккаунт, впишите в .env <code>TWITCH_USER_ID=${who.user_id}</code>; если отдельный бот — <code>TWITCH_BOT_ID=${who.user_id}</code>. `
        : '') +
      (role === 'broadcaster'
        ? 'Первый токен стримера бот подхватит сам; после повторного входа перезапустите бота.'
        : 'Запустите (или перезапустите) бота с BOT_ENABLED=true.'),
  );
});
