import { defaultSeasons, resolveSeason, SEASONS, type SeasonId, type SeasonIntensity, type SeasonStates } from '#shared/seasons';

// Сезонные темы сцены. Как и виджеты: оверлей без доступа к боту перечитывает состояние с сервера раз в POLL_MS,
// а пока ответа нет, действует последнее известное.
const POLL_MS = 4000;

export const useSeasons = () => {
  const states = useState<SeasonStates>('seasons', defaultSeasons);
  let timer: ReturnType<typeof setTimeout> | undefined;
  let alive = false;

  const load = async () => {
    try {
      states.value = await $fetch<SeasonStates>('/api/seasons');
    } catch {
      // Сервер перезапускается: оставляем как есть
    }
    if (alive) timer = setTimeout(load, POLL_MS);
  };

  const start = () => {
    alive = true;
    void load();
  };
  const stop = () => {
    alive = false;
    clearTimeout(timer);
  };

  // Интенсивность темы на сегодня или null, если она не показывается; даты считаются по часам браузера
  const active = (id: SeasonId, date: Date = new Date()): SeasonIntensity | null => {
    const season = SEASONS.find((item) => item.id === id);
    return season ? resolveSeason(season, states.value[id], date) : null;
  };
  return { states, active, start, stop };
};
