import { defineStore } from 'pinia';
import type { LeaderboardShowPayload } from '#shared/events';

export type ActiveLeaderboard = LeaderboardShowPayload & { id: number };

// Сколько карточка висит на экране
export const LEADERBOARD_SHOW_MS = 9000;
const GAP_MS = 400;
const QUEUE_MAX = 5;
// Сколько рулетка и лотерея должны пустовать, прежде чем выйдет карточка
const QUIET_MS = 600;

// Карточки лидерборда по одной, как профиль: слева от центра. Пока в центре рулетка или лотерея, карточка ждёт.
export const useLeaderboardStore = defineStore('leaderboard', () => {
  const current = ref<ActiveLeaderboard | null>(null);
  const queue: LeaderboardShowPayload[] = [];
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
      setTimeout(showNext, GAP_MS);
    }, LEADERBOARD_SHOW_MS);
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

  const onShow = (payload: LeaderboardShowPayload) => {
    if (queue.length >= QUEUE_MAX) queue.shift();
    queue.push(payload);
    if (!busy) showNext();
  };

  return { current, onShow };
});
