import { BOT_LANG, MESSAGES, type BotMessages, type Lang } from '../../shared/i18n';

// Единственное место, где бот выбирает язык ответов: настройка из админки встанет сюда.
// Вызывается в момент отправки, а не при запуске, чтобы смена языка не требовала перезапуска.
export const language = (): Lang => BOT_LANG;

export const messages = (): BotMessages => MESSAGES[language()];
