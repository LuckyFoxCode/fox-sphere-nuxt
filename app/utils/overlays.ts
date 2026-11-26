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
  { path: '/overlay/stream', title: 'Шапка стрима', description: 'Банк рулетки, уровень и XP стрима справа сверху, виден постоянно.', width: 1920, height: 1080 },
  { path: '/overlay/roulette', title: 'Рулетка', description: 'Лента призов по центру на каждый !spin, экран джекпота со звуком. Между вращениями пусто.', width: 1920, height: 1080 },
  { path: '/overlay/chat', title: 'Чат', description: 'Колонка 400 px слева внизу: до 5 сообщений, каждое живёт 18 с.', width: 1920, height: 1080 },
  { path: '/overlay/alerts', title: 'Алерты', description: 'Follow, рейд, награда за баллы, подписки и сундук из рыбалки по очереди снизу по центру, со звуком.', width: 1920, height: 1080 },
  { path: '/overlay/music', title: 'Сейчас играет', description: 'Карточка трека справа под шапкой: обложка, исполнитель, название, полоска времени. Данные бот берёт из системного плеера Windows (Brave), только на Windows.', width: 1920, height: 1080 },
];
