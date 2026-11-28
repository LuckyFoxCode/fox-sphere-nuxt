import { defineStore } from 'pinia';
import type { TowerFightPayload } from '#shared/events';

// Бои башни по одному. Очередь по зрителям ведёт бот и присылает бой, когда приходит его черёд,
// но запас здесь нужен: оверлей мог перезагрузиться или опоздать, и два боя не должны наложиться.
const QUEUE_MAX = 10;
const GAP_MS = 500;

export const useTowerStore = defineStore('tower', () => {
  const current = ref<TowerFightPayload | null>(null);
  const queue: TowerFightPayload[] = [];

  const next = () => {
    current.value = queue.shift() ?? null;
  };

  const onFight = (payload: TowerFightPayload) => {
    if (queue.length >= QUEUE_MAX) return;
    queue.push(payload);
    if (!current.value) next();
  };

  // Арена доиграла бой и сама дёргает это: показать следующий или спрятаться
  const finish = () => {
    current.value = null;
    if (queue.length) setTimeout(next, GAP_MS);
  };

  return { current, onFight, finish };
});
