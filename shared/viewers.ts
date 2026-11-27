// Что раздел админки «Зрители» получает от сервера.
import type { AchievementCounters } from './achievements';

export type AdminViewer = {
  id: number;
  username: string;
  lvl: number;
  xp: number;
  coins: number;
  createdAt: string;
  // Когда сообщение в чате в последний раз дало XP; null — ни разу
  lastXpAt: string | null;
  isStreamer: boolean;
  isBot: boolean;
  // Модератор и саб — по бейджам последнего сообщения
  isMod: boolean;
  isSubscriber: boolean;
  isFounder: boolean;
  isPermanentVip: boolean;
  // Временный VIP из последней лотереи
  isLuckyVip: boolean;
  hasTicket: boolean;
};

export type AdminCoinRecord = { id: number; amount: number; reason: string; createdAt: string };

export type AdminViewerDetails = {
  viewer: AdminViewer;
  spinsCount: number;
  totalWin: number;
  totalLoss: number;
  goldenBeers: number;
  xpThisWeek: number;
  // Из них считаются ачивки, как в боте; там же лучший стрик
  counters: AchievementCounters;
  // Награждённые стрики просмотров, новые сверху
  streaks: { value: number; createdAt: string }[];
  heroes: { id: string; name: string; level: number; active: boolean }[];
  // Все операции с монетами, новые сверху
  history: AdminCoinRecord[];
};

// Причины из CoinHistory (prisma/schema.prisma)
export const COIN_REASONS: Record<string, string> = {
  BOSS_REWARD: 'Награда за босса',
  GIFT: 'Подарок',
  LOTTERY: 'Лотерея',
  CHANGE_POINTS: 'Обмен баллов канала',
  WATCH_STREAK: 'Стрик просмотров',
  SPIN: 'Спин рулетки',
  SPIN_PRIZE: 'Приз рулетки',
  JACKPOT: 'Джекпот',
  FISH: 'Рыбалка',
  HERO_PURCHASE: 'Покупка героя',
};
