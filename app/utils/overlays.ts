// Оверлеи для главной страницы. Новый виджет — новая запись в OVERLAYS.
export interface OverlayEntry {
  path: string;
  title: string;
  description: string;
  /** Рекомендуемый размер Browser Source в OBS */
  width: number;
  height: number;
}

export const OVERLAYS: readonly OverlayEntry[] = [
  { path: '/overlay/stream', title: 'Шапка стрима', description: 'Уровень и XP стрима справа сверху, виден постоянно.', width: 1920, height: 1080 },
  { path: '/overlay/chat', title: 'Чат', description: 'Колонка 400 px слева внизу: до 5 сообщений, каждое живёт 18 с.', width: 1920, height: 1080 },
  { path: '/overlay/xp', title: 'XP и level-up', description: 'XP-карточка зрителя справа сверху, наклейка level-up снизу по центру.', width: 1920, height: 1080 },
  { path: '/overlay/alerts', title: 'Алерты', description: 'Follow, рейд, награда за баллы и подписки по очереди снизу по центру, со звуком.', width: 1920, height: 1080 },
];
