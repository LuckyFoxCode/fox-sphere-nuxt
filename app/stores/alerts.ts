import { defineStore } from 'pinia';
import type { FollowPayload, RaidPayload, RewardRedeemPayload, SubPayload } from '#shared/events';
import type { AlertView } from '~/utils/alerts';

export type QueuedAlert = AlertView & { id: number };

// Пауза между алертами: стикер успевает уйти (140 мс) и на экране на миг пусто
const ALERT_GAP_MS = 400;
// Предел очереди на случай волны фолловов: самые старые выпадают
const ALERT_QUEUE_MAX = 50;

// Очередь алертов: показывается один, следующий ждёт, пока он уйдёт.
export const useAlertsStore = defineStore('alerts', () => {
  const current = ref<QueuedAlert | null>(null);

  const queue: AlertView[] = [];
  // busy: алерт на экране или идёт пауза после него
  let busy = false;
  let seq = 0;

  const showNext = () => {
    const next = queue.shift();
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

  const onFollow = (payload: FollowPayload) => push(followAlert(payload));
  const onRaid = (payload: RaidPayload) => push(raidAlert(payload));
  const onRewardRedeem = (payload: RewardRedeemPayload) => push(rewardAlert(payload));
  const onSub = (payload: SubPayload) => push(subAlert(payload));

  return { current, onFollow, onRaid, onRewardRedeem, onSub };
});
