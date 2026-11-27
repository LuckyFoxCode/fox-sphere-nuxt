import { randomBytes } from 'node:crypto';
import type { H3Event } from 'h3';
import { scopesFor, type TokenRole } from '../../shared/twitch';

// Общая часть входов: бота (/auth/twitch/login), стримера (/auth/twitch/broadcaster/login) и админки
// (/auth/twitch/admin/login). Все возвращаются на один и тот же Redirect URL; роль запоминается в cookie.
// Секреты читаем из process.env напрямую, а не из runtimeConfig, чтобы они не попали в сборку.
// `admin` — только узнать, кто вошёл: без прав и без сохранения токена
export type LoginRole = TokenRole | 'admin';

export const isLoginRole = (value: unknown): value is LoginRole =>
  value === 'bot' || value === 'broadcaster' || value === 'admin';

export const startTwitchLogin = (event: H3Event, role: LoginRole) => {
  const clientId = process.env.TWITCH_CLIENT_ID;
  const redirectUri = process.env.TWITCH_BOT_REDIRECT_URI;
  if (!clientId || !redirectUri) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Не заданы TWITCH_CLIENT_ID или TWITCH_BOT_REDIRECT_URI в .env',
    });
  }
  const botId = process.env.TWITCH_BOT_ID ?? '';
  const userId = process.env.TWITCH_USER_ID ?? '';
  if (role === 'broadcaster' && !userId) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Для входа стримера задайте TWITCH_USER_ID в .env (id вашего аккаунта)',
    });
  }

  const state = randomBytes(16).toString('hex');
  const cookie = { httpOnly: true, sameSite: 'lax', maxAge: 600, path: '/auth/twitch' } as const;
  setCookie(event, 'twitch_oauth_state', state, cookie);
  setCookie(event, 'twitch_oauth_role', role, cookie);

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: role === 'admin' ? '' : scopesFor(role, botId, userId).join(' '),
    state,
    force_verify: 'true', // всегда показывать выбор аккаунта: легко залогиниться не тем
  });
  return sendRedirect(event, `https://id.twitch.tv/oauth2/authorize?${params}`);
};
