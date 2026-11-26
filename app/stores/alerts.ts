import { defineStore } from 'pinia';
import type {
  AddVipPayload,
  FishingChestPayload,
  FollowPayload,
  GoldenBeerPayload,
  RaidPayload,
  RewardRedeemPayload,
  SubPayload,
} from '#shared/events';
import type { AlertView } from '~/utils/alerts';

export type QueuedAlert = AlertView & { id: number };

// Пауза между алертами: стикер успевает уйти (140 мс) и на экране на миг пусто
const ALERT_GAP_MS = 400;
// Предел очереди на случай волны фолловов: самые старые выпадают
const ALERT_QUEUE_MAX = 50;
// Сколько сцена рулетки должна пустовать, прежде чем выйдет отложенный сундук: следующее
// вращение из очереди бота начинается почти сразу после предыдущего
const ROULETTE_QUIET_MS = 600;

// Очередь алертов: показывается один, следующий ждёт, пока он уйдёт. Сундук не выходит поверх
// рулетки: пока на сцене вращение или джекпот, он ждёт, а остальные алерты проходят вперёд.
export const useAlertsStore = defineStore('alerts', () => {
  const current = ref<QueuedAlert | null>(null);

  const queue: AlertView[] = [];
  // busy: алерт на экране или идёт пауза после него
  let busy = false;
  let seq = 0;

  const roulette = useRouletteStore();
  const isHeld = (alert: AlertView) => alert.kind === 'chest' && roulette.busy;

  const showNext = () => {
    const index = queue.findIndex((alert) => !isHeld(alert));
    const next = index === -1 ? undefined : queue.splice(index, 1)[0];
    busy = next !== undefined;
    if (!next) return;
    current.value = { ...next, id: ++seq };
    setTimeout(() => {
      current.value = null;
      setTimeout(showNext, ALERT_GAP_MS);
    }, next.durationMs);
  };

  const push = (alert: AlertView) => {
    if (queue.length >= ALERT_QUEUE_MAX) queue.shift();
    queue.push(alert);
    if (!busy) showNext();
  };

  let quietTimer: ReturnType<typeof setTimeout> | undefined;
  watch(
    () => roulette.busy,
    (spinning) => {
      clearTimeout(quietTimer);
      if (spinning) return;
      quietTimer = setTimeout(() => {
        if (!busy) showNext();
      }, ROULETTE_QUIET_MS);
    },
  );

  const onFollow = (payload: FollowPayload) => push(followAlert(payload));
  const onRaid = (payload: RaidPayload) => push(raidAlert(payload));
  const onRewardRedeem = (payload: RewardRedeemPayload) => push(rewardAlert(payload));
  const onSub = (payload: SubPayload) => push(subAlert(payload));
  const onFishingChest = (payload: FishingChestPayload) => push(chestAlert(payload));
  const onGoldenBeer = (payload: GoldenBeerPayload) => push(goldenBeerAlert(payload));

  const onAddVip = (payload: AddVipPayload) => push(addVipAlert(payload));

  return { current, onFollow, onRaid, onRewardRedeem, onSub, onFishingChest, onGoldenBeer, onAddVip };
});
