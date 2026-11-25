import type { ApiClient } from '@twurple/api';
import type { ChatAnnounceColor } from '../../shared/events';

// Twitch принимает один анонс в 2 секунды (в старом боте — COOLDOWNS.ANNOUNCEMENT_QUEUE)
const ANNOUNCEMENT_INTERVAL_MS = 2000;

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// Подсказка к отказу Twitch; сама ошибка пишется в лог рядом
const hintFor = (error: unknown): string => {
  switch ((error as { statusCode?: number }).statusCode) {
    case 400:
      return 'Twitch отклонил запрос (для шаутаута стрим должен идти и иметь зрителей)';
    case 401:
      return 'у токена бота нет нужного права: войдите заново и перезапустите бота; проверьте и /mod';
    case 403:
      return 'бот не модератор канала: выполните в чате стримера /mod <ник бота>';
    case 429:
      return 'лимит Twitch (шаутаут — раз в 2 минуты, одному каналу — раз в час)';
    default:
      return 'если не хватает прав, войдите заново под ботом и перезапустите его';
  }
};

type AnnouncerOptions = {
  api: ApiClient;
  // Аккаунт, от имени которого идут запросы. Может совпадать со стримером
  botUserId: string;
  // Канал (TWITCH_USER_ID). Пусто — анонсы и шаутауты выключены
  broadcasterId: string;
  onAnnouncementSent?: (message: string, color: ChatAnnounceColor) => Promise<void> | void;
};

// Анонсы и шаутауты через Helix. Оба метода не бросают исключений: отказ Twitch попадает в лог,
// а результат (отправлено или нет) возвращается вызывающему.
export const createAnnouncer = ({ api, botUserId, broadcasterId, onAnnouncementSent }: AnnouncerOptions) => {
  const ready = (what: string): boolean => {
    if (broadcasterId) return true;
    console.warn(`[announce] ${what} не отправлен: задайте TWITCH_USER_ID в .env (id канала)`);
    return false;
  };

  const send = async (message: string, color: ChatAnnounceColor): Promise<boolean> => {
    try {
      await api.asUser(botUserId, (ctx) => ctx.chat.sendAnnouncement(broadcasterId, { message, color }));
    } catch (error) {
      console.error(`[announce] анонс не отправлен (${hintFor(error)}): "${message}"`, error);
      return false;
    }
    console.log(`[announce] анонс (${color}): ${message}`);
    try {
      await onAnnouncementSent?.(message, color);
    } catch (error) {
      console.error('[announce] анонс отправлен, но не показан в оверлее:', error);
    }
    return true;
  };

  // Очередь: следующий анонс уходит не раньше чем через интервал после предыдущего
  let tail: Promise<void> = Promise.resolve();

  const announce = (message: string, color: ChatAnnounceColor = 'blue'): Promise<boolean> => {
    if (!ready('анонс')) return Promise.resolve(false);
    const result = tail.then(() => send(message, color));
    tail = result.then(() => sleep(ANNOUNCEMENT_INTERVAL_MS));
    return result;
  };

  const shoutout = async (targetUserId: string): Promise<boolean> => {
    // Самому себе Twitch шаутаут не разрешает
    if (!ready('шаутаут') || targetUserId === broadcasterId) return false;
    try {
      await api.asUser(botUserId, (ctx) => ctx.chat.shoutoutUser(broadcasterId, targetUserId));
    } catch (error) {
      console.error(`[announce] шаутаут ${targetUserId} не отправлен (${hintFor(error)}):`, error);
      return false;
    }
    console.log(`[announce] шаутаут ${targetUserId} отправлен`);
    return true;
  };

  return { announce, shoutout };
};
