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

export type AdminBackup = { name: string; createdAt: string; size: number };

// Копии базы текущего окружения: папка на этом компьютере и файлы в ней, новые сверху
export type AdminBackups = { folder: string; database: string; items: AdminBackup[] };
