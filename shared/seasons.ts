// Сезонные события оверлея: тема-праздник с украшениями на общей сцене `/overlay/scene`.
// Новая тема — новая запись в SEASONS и компонент украшений в `app/components/season/`.
export type SeasonDate = { month: number; day: number };

export type SeasonInfo = {
  id: string;
  title: string;
  description: string;
  /** Окно режима «авто по датам», обе границы включительно; если `to` раньше `from`, окно переходит через Новый год */
  from: SeasonDate;
  to: SeasonDate;
};

export const SEASONS = [
  {
    id: 'christmas',
    title: 'Рождество и Новый год',
    description: 'Гирлянда по верхней кромке и лёгкий снег по краям кадра.',
    from: { month: 12, day: 15 },
    to: { month: 1, day: 10 },
  },
] as const satisfies readonly SeasonInfo[];

export type SeasonId = (typeof SEASONS)[number]['id'];

// off — выключено, on — включено всегда, auto — только в окне дат темы (ручное «вкл» и «выкл» главнее дат)
export const SEASON_MODES = ['off', 'auto', 'on'] as const;
export type SeasonMode = (typeof SEASON_MODES)[number];

export const SEASON_INTENSITIES = ['light', 'full'] as const;
export type SeasonIntensity = (typeof SEASON_INTENSITIES)[number];

export type SeasonState = { mode: SeasonMode; intensity: SeasonIntensity };
export type SeasonStates = Record<SeasonId, SeasonState>;

export const defaultSeasons = (): SeasonStates =>
  Object.fromEntries(SEASONS.map((season) => [season.id, { mode: 'off', intensity: 'light' }])) as SeasonStates;

export const isSeasonId = (value: unknown): value is SeasonId => SEASONS.some((season) => season.id === value);
export const isSeasonMode = (value: unknown): value is SeasonMode => SEASON_MODES.some((mode) => mode === value);
export const isSeasonIntensity = (value: unknown): value is SeasonIntensity =>
  SEASON_INTENSITIES.some((intensity) => intensity === value);

// Из базы или тела запроса: неизвестные темы и значения отбрасываются, недостающее берёт умолчание
export const toSeasons = (value: unknown): SeasonStates => {
  const states = defaultSeasons();
  if (typeof value !== 'object' || value === null) return states;
  for (const [id, raw] of Object.entries(value)) {
    if (!isSeasonId(id) || typeof raw !== 'object' || raw === null) continue;
    const { mode, intensity } = raw as { mode?: unknown; intensity?: unknown };
    if (isSeasonMode(mode)) states[id].mode = mode;
    if (isSeasonIntensity(intensity)) states[id].intensity = intensity;
  }
  return states;
};

export const parseSeasonsJson = (json: string | null | undefined): SeasonStates => {
  if (!json) return defaultSeasons();
  try {
    return toSeasons(JSON.parse(json));
  } catch {
    return defaultSeasons();
  }
};

// Запрос админки: одна тема и что в ней меняется (режим, интенсивность или оба)
export type SeasonUpdate = { id: SeasonId; mode?: SeasonMode; intensity?: SeasonIntensity };

export const parseSeasonUpdate = (body: unknown): SeasonUpdate | null => {
  const { id, mode, intensity } = (body ?? {}) as { id?: unknown; mode?: unknown; intensity?: unknown };
  if (!isSeasonId(id)) return null;
  if (mode !== undefined && !isSeasonMode(mode)) return null;
  if (intensity !== undefined && !isSeasonIntensity(intensity)) return null;
  if (mode === undefined && intensity === undefined) return null;
  return { id, ...(mode !== undefined && { mode }), ...(intensity !== undefined && { intensity }) };
};

const dayKey = ({ month, day }: SeasonDate): number => month * 100 + day;

export const isInSeasonWindow = (season: SeasonInfo, date: Date): boolean => {
  const key = dayKey({ month: date.getMonth() + 1, day: date.getDate() });
  const from = dayKey(season.from);
  const to = dayKey(season.to);
  return from <= to ? key >= from && key <= to : key >= from || key <= to;
};

// Что рисовать сейчас: интенсивность или null, если тему показывать не нужно
export const resolveSeason = (season: SeasonInfo, state: SeasonState, date: Date): SeasonIntensity | null => {
  if (state.mode === 'off') return null;
  if (state.mode === 'auto' && !isInSeasonWindow(season, date)) return null;
  return state.intensity;
};
