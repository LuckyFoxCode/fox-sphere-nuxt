// Виджеты общей сцены `/overlay/scene`, которые можно включать и выключать в админке.
// Новый виджет — новая запись здесь и `v-if="widgets.on('id')"` в сцене.
export type WidgetInfo = {
  id: string;
  title: string;
  description: string;
  /** Включён, пока в админке его не трогали */
  enabled: boolean;
};

export const WIDGETS = [
  { id: 'chat', title: 'Чат', description: 'Колонка слева внизу с последними сообщениями.', enabled: true },
  { id: 'timer', title: 'Таймер', description: 'Таймер !timer над чатом.', enabled: true },
  { id: 'header', title: 'Шапка стрима', description: 'Банк рулетки, уровень и XP стрима справа сверху.', enabled: true },
  { id: 'music', title: 'Сейчас играет', description: 'Карточка трека справа под шапкой.', enabled: true },
  { id: 'heroes', title: 'Герои', description: 'Герои зрителей ходят по нижнему краю.', enabled: true },
  { id: 'alerts', title: 'Алерты', description: 'Follow, рейды, награды и подписки снизу по центру.', enabled: true },
  { id: 'roulette', title: 'Рулетка', description: 'Лента призов и экран джекпота по команде !spin.', enabled: true },
  { id: 'lottery', title: 'Лотерея VIP', description: 'Розыгрыш недельных VIP по центру.', enabled: true },
  { id: 'profile', title: 'Карточка профиля', description: 'Карточка по команде !profile.', enabled: true },
  { id: 'leaderboard', title: 'Лидерборд', description: 'Топ-5 по награде Flex Leaderboard.', enabled: true },
  { id: 'shop', title: 'Магазин героев', description: 'Окно по команде !shop.', enabled: true },
  {
    id: 'webcam',
    title: 'Рамка вебки',
    description: 'Рамка под камеру справа под музыкой. Сама камера — отдельный источник в OBS под оверлеем.',
    enabled: false,
  },
] as const satisfies readonly WidgetInfo[];

export type WidgetId = (typeof WIDGETS)[number]['id'];
export type WidgetStates = Record<WidgetId, boolean>;

export const defaultWidgets = (): WidgetStates =>
  Object.fromEntries(WIDGETS.map((widget) => [widget.id, widget.enabled])) as WidgetStates;

export const isWidgetId = (value: unknown): value is WidgetId => WIDGETS.some((widget) => widget.id === value);

// Из базы или тела запроса: неизвестные ключи и не-булевы значения отбрасываются, недостающие берут умолчание
export const toWidgets = (value: unknown): WidgetStates => {
  const states = defaultWidgets();
  if (typeof value !== 'object' || value === null) return states;
  for (const [id, on] of Object.entries(value)) {
    if (isWidgetId(id) && typeof on === 'boolean') states[id] = on;
  }
  return states;
};

export const parseWidgetsJson = (json: string | null | undefined): WidgetStates => {
  if (!json) return defaultWidgets();
  try {
    return toWidgets(JSON.parse(json));
  } catch {
    return defaultWidgets();
  }
};

// Запрос админки: один виджет и его новое состояние
export const parseWidgetUpdate = (body: unknown): { id: WidgetId; enabled: boolean } | null => {
  const { id, enabled } = (body ?? {}) as { id?: unknown; enabled?: unknown };
  return isWidgetId(id) && typeof enabled === 'boolean' ? { id, enabled } : null;
};
