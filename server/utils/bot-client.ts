// Вызов внутреннего API бота (bot/src/internal.ts). Только из обработчиков, уже проверивших сессию.
import { INTERNAL_PREFIX, isUsableSecret } from '../../shared/admin';
import { resolveSocketPort } from '../../shared/events';

// Текст причины уходит в data.error: его показывает пульт
const botError = (statusCode: number, error: string) =>
  createError({ statusCode, statusMessage: 'Bot request failed', data: { error } });

type BotPath = '/state' | '/followers' | '/boost' | '/timer' | '/lottery' | '/test';

export const callBot = async <T>(path: BotPath, body?: object): Promise<T> => {
  const secret = process.env.INTERNAL_SECRET;
  if (!isUsableSecret(secret)) throw botError(503, 'Не задан INTERNAL_SECRET в .env (см. .env.example)');

  const listen = process.env.SOCKET_HOST;
  const host = !listen || listen === '0.0.0.0' || listen === '::' ? '127.0.0.1' : listen;
  const url = `http://${host}:${resolveSocketPort(process.env.SOCKET_PORT)}${INTERNAL_PREFIX}${path}`;

  try {
    return await $fetch<T>(url, {
      method: body ? 'POST' : 'GET',
      body,
      headers: { authorization: `Bearer ${secret}` },
      retry: 0,
      timeout: 10_000,
    });
  } catch (error) {
    const { response, data } = error as { response?: { status: number }; data?: { error?: string } };
    if (!response) throw botError(502, 'Бот не отвечает. Он запущен?');
    // 401 бота — это разные секреты, а не потерянный вход стримера: отдаём другим кодом
    const status = response.status === 401 ? 502 : response.status;
    throw botError(status, data?.error ?? 'Бот не принял запрос. Он запущен свежей версии?');
  }
};
