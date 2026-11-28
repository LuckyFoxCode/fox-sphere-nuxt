import { defaultWidgets, type WidgetId, type WidgetStates } from '#shared/widgets';

// Включённые виджеты сцены. Оверлей — браузер в OBS без доступа к боту, поэтому список перечитывается
// с сервера раз в POLL_MS; пока ответа нет или сервер не отвечает, действует последнее известное состояние.
const POLL_MS = 4000;

export const useWidgets = () => {
  const states = useState<WidgetStates>('widgets', defaultWidgets);
  let timer: ReturnType<typeof setTimeout> | undefined;
  let alive = false;

  const load = async () => {
    try {
      states.value = await $fetch<WidgetStates>('/api/widgets');
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

  const on = (id: WidgetId): boolean => states.value[id];
  return { states, on, start, stop };
};
