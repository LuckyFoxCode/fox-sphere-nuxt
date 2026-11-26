import { defineStore } from 'pinia';
import type { ProfileShowPayload } from '#shared/events';

export type ActiveProfile = ProfileShowPayload & { id: number };

// Сколько карточка висит на экране
export const PROFILE_SHOW_MS = 9000;
const PROFILE_GAP_MS = 400;
const QUEUE_MAX = 10;
// Сколько рулетка и лотерея должны пустовать, прежде чем выйдет карточка
const QUIET_MS = 600;

// Карточки профиля по одной. Центр экрана занимают рулетка и лотерея: пока они на сцене, карточка ждёт.
export const useProfileStore = defineStore('profile', () => {
  const current = ref<ActiveProfile | null>(null);
  const queue: ProfileShowPayload[] = [];
  let busy = false;
  let seq = 0;

  const roulette = useRouletteStore();
  const lottery = useLotteryStore();
  const isHeld = () => roulette.busy || lottery.claimed;

  const showNext = () => {
    if (isHeld()) {
      busy = false;
      return;
    }
    const next = queue.shift();
    busy = next !== undefined;
    if (!next) return;
    current.value = { ...next, id: ++seq };
    setTimeout(() => {
      current.value = null;
      setTimeout(showNext, PROFILE_GAP_MS);
    }, PROFILE_SHOW_MS);
  };

  let quietTimer: ReturnType<typeof setTimeout> | undefined;
  watch(
    () => [roulette.busy, lottery.claimed],
    () => {
      clearTimeout(quietTimer);
      if (isHeld()) return;
      quietTimer = setTimeout(() => {
        if (!busy) showNext();
      }, QUIET_MS);
    },
  );

  const onShow = (payload: ProfileShowPayload) => {
    if (queue.length >= QUEUE_MAX) queue.shift();
    queue.push(payload);
    if (!busy) showNext();
  };

  return { current, onShow };
});
