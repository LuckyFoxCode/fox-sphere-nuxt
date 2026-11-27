// Что раздел админки «Настройки» получает от сервера.
import type { Lang } from './i18n';

export type AdminAccount = {
  // Бот и стример могут быть одним аккаунтом: тогда запись одна
  role: 'bot' | 'broadcaster' | 'both';
  authorized: boolean;
  // Когда токен последний раз сохранялся (вход или автообновление ботом)
  updatedAt: string | null;
};

export type AdminSettings = { botLang: Lang; accounts: AdminAccount[] };
