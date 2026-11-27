import { BOT_LANG, MESSAGES, toLang, type BotMessages, type Lang } from '../../shared/i18n';
import { prisma } from './db';

// Единственное место, где бот выбирает язык ответов. Выбор из админки лежит в SystemState.botLang:
// бот перечитывает его раз в несколько секунд, поэтому смена языка не требует перезапуска.
const REFRESH_MS = 5000;

let current: Lang = BOT_LANG;
let failing = false;

const refresh = async (): Promise<void> => {
  try {
    const row = await prisma.systemState.findUnique({ where: { id: 1 }, select: { botLang: true } });
    const next = toLang(row?.botLang);
    if (next !== current) console.log(`[bot] язык ответов: ${next}`);
    current = next;
    failing = false;
  } catch (error) {
    // Пишем в лог один раз, а не каждые 5 секунд; язык остаётся прежним
    if (!failing) console.error('[bot] не удалось прочитать язык ответов из базы:', error);
    failing = true;
  }
};

// Вызывается при запуске, чтобы первое же сообщение ушло на выбранном языке
export const startLanguageSync = async (): Promise<void> => {
  await refresh();
  setInterval(() => void refresh(), REFRESH_MS).unref();
};

// Вызывается в момент отправки, а не при запуске
export const language = (): Lang => current;

export const messages = (): BotMessages => MESSAGES[language()];
