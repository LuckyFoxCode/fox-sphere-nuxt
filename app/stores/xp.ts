import { defineStore } from 'pinia';
import type { LevelUpPayload, XpGainPayload } from '#shared/events';

export type ConnectionState = 'connecting' | 'connected' | 'disconnected';

const GAIN_VISIBLE_MS = 6000;
const LEVEL_UP_VISIBLE_MS = 7000;
// Пауза перед level-up: полоса успевает дойти до 100%
const LEVEL_UP_DELAY_MS = 900;
const LEVEL_UP_GAP_MS = 400;
const LEVEL_UP_QUEUE_MAX = 5;

export const useXpStore = defineStore('xp', () => {
  const connection = ref<ConnectionState>('connecting');
  const gain = ref<XpGainPayload | null>(null);
  const gainVisible = ref(false);
  const levelUp = ref<LevelUpPayload | null>(null);

  const queue: LevelUpPayload[] = [];
  let gainTimer: ReturnType<typeof setTimeout> | undefined;
  let levelTimer: ReturnType<typeof setTimeout> | undefined;

  const onXpGain = (payload: XpGainPayload) => {
    gain.value = payload;
    gainVisible.value = true;
    clearTimeout(gainTimer);
    gainTimer = setTimeout(() => (gainVisible.value = false), GAIN_VISIBLE_MS);
  };

  // busy: показ level-up запланирован или идёт; следующий берётся из очереди по окончании
  let busy = false;

  const showNextLevelUp = (delay: number) => {
    busy = true;
    levelTimer = setTimeout(() => {
      const next = queue.shift();
      if (!next) {
        busy = false;
        return;
      }
      levelUp.value = next;
      levelTimer = setTimeout(() => {
        levelUp.value = null;
        if (queue.length > 0) showNextLevelUp(LEVEL_UP_GAP_MS);
        else busy = false;
      }, LEVEL_UP_VISIBLE_MS);
    }, delay);
  };

  const onLevelUp = (payload: LevelUpPayload) => {
    if (queue.length >= LEVEL_UP_QUEUE_MAX) queue.shift();
    queue.push(payload);
    if (!busy) showNextLevelUp(LEVEL_UP_DELAY_MS);
  };

  return { connection, gain, gainVisible, levelUp, onXpGain, onLevelUp };
});
