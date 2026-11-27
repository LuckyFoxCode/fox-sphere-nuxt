import { defineStore } from 'pinia';
import type { ShopShowPayload } from '#shared/events';
import { HEROES } from '#shared/heroes';
import { countPages, SHOP_PAGE_MS } from '~/utils/shopPaging';

export type ActiveShop = ShopShowPayload & { id: number };

// Сколько окно висит на экране: каждая страница героев получает своё время, чтобы статы успели прочесть
export const SHOP_SHOW_MS = Math.max(12000, countPages(HEROES.length) * SHOP_PAGE_MS);
const SHOP_GAP_MS = 400;
const QUEUE_MAX = 5;
// Сколько рулетка и лотерея должны пустовать, прежде чем выйдет окно
const QUIET_MS = 600;

// Окна магазина по одному, как карточки профиля: пока в центре рулетка, лотерея или карточка профиля, окно ждёт.
export const useShopStore = defineStore('shop', () => {
  const current = ref<ActiveShop | null>(null);
  const queue: ShopShowPayload[] = [];
  let busy = false;
  let seq = 0;

  const roulette = useRouletteStore();
  const lottery = useLotteryStore();
  // Карточка профиля стоит справа от центра и частично под окном: магазин ждёт, пока она уйдёт
  const profile = useProfileStore();
  const isHeld = () => roulette.busy || lottery.claimed || profile.current !== null;

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
      setTimeout(showNext, SHOP_GAP_MS);
    }, SHOP_SHOW_MS);
  };

  let quietTimer: ReturnType<typeof setTimeout> | undefined;
  watch(
    () => [roulette.busy, lottery.claimed, profile.current],
    () => {
      clearTimeout(quietTimer);
      if (isHeld()) return;
      quietTimer = setTimeout(() => {
        if (!busy) showNext();
      }, QUIET_MS);
    },
  );

  const onShow = (payload: ShopShowPayload) => {
    if (queue.length >= QUEUE_MAX) queue.shift();
    queue.push(payload);
    if (!busy) showNext();
  };

  return { current, onShow };
});
