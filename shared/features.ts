// Единый список функций и виджетов с ярлыками стадии и версией появления.
// Менять стадию или добавлять функцию — правка одной строки здесь (правила — в CLAUDE.md, «Версии и ярлыки»).
// Функции без записи считаются стабильными и без ярлыка.
export type FeatureStage = 'stable' | 'beta';

export type FeatureInfo = {
  /** Стадия: stable — готово (ярлыка нет), beta — ещё чинится, тестируется или балансируется */
  stage: FeatureStage;
  /** Версия проекта, в которой функция появилась. По ней же гаснет ярлык NEW */
  since: string;
};

/** Ярлык NEW висит, пока текущая версия новее версии появления меньше чем на два минорных шага */
export const NEW_MINOR_STEPS = 2;

// Ключ: `widget:<id>` для виджета сцены (id из shared/widgets.ts), остальное — произвольный id функции
export const FEATURES = {
  'widget:tower': { stage: 'beta', since: '0.2.0' },
  'widget:webcam': { stage: 'beta', since: '0.1.0' },
  tower: { stage: 'beta', since: '0.2.0' },
  'tower-bonus': { stage: 'beta', since: '0.2.0' },
  events: { stage: 'beta', since: '0.1.0' },
  games: { stage: 'beta', since: '0.3.0' },
} as const satisfies Record<string, FeatureInfo>;

export type FeatureId = keyof typeof FEATURES;

export const STAGE_LABELS: Record<Exclude<FeatureStage, 'stable'>, string> = {
  beta: 'Beta',
};

const parseVersion = (version: string): [number, number] | null => {
  const match = /^(\d+)\.(\d+)\./.exec(version);
  return match ? [Number(match[1]), Number(match[2])] : null;
};

/** NEW по версии, не по дате: показываем, пока минорная версия проекта ушла от версии функции меньше чем на два шага */
export const isNewFeature = (since: string, current: string): boolean => {
  const from = parseVersion(since);
  const now = parseVersion(current);
  if (!from || !now || from[0] !== now[0]) return false;
  const steps = now[1] - from[1];
  return steps >= 0 && steps < NEW_MINOR_STEPS;
};
