// Языки ответов бота в чате. Оверлеи сюда не входят.
import { en } from './en';
import { ru } from './ru';
import type { BotMessages } from './types';
import { uk } from './uk';

export type { BotMessages, FishMessages, ProfileStats } from './types';

// Порядок — по важности: en основной, uk второй, ru дополнительный
export const LANGS = ['en', 'uk', 'ru'] as const;
export type Lang = (typeof LANGS)[number];

// Язык бота. Пока константа; переключатель появится вместе с админкой
export const BOT_LANG: Lang = 'en';

export const MESSAGES: Record<Lang, BotMessages> = { en, uk, ru };
