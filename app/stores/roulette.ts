import { defineStore } from 'pinia';
import type { RouletteSpinResultPayload } from '#shared/events';
import {
  ROULETTE_GAP_MS,
  ROULETTE_JACKPOT_SHOW_MS,
  ROULETTE_RESULT_SHOW_MS,
  ROULETTE_SPIN_ANIMATION_MS,
} from '#shared/roulette';

// spinning — лента крутится; result — лента встала на призе;
// jackpot — после секунды на ленте весь экран занимает джекпот (тайминги старого fox-sphere)
export type SpinPhase = 'spinning' | 'result' | 'jackpot';

export type ActiveSpin = RouletteSpinResultPayload & { id: number };

const JACKPOT_TAPE_MS = 1000;
const QUEUE_MAX = 20;

// Вращения по одному: пока показан один результат, следующий ждёт. Бот и сам выдерживает паузы,
// очередь здесь — страховка, чтобы два события никогда не наложились.
export const useRouletteStore = defineStore('roulette', () => {
  const current = ref<ActiveSpin | null>(null);
  const phase = ref<SpinPhase>('spinning');

  const queue: RouletteSpinResultPayload[] = [];
  // true, пока идут вращения, включая паузы между ними: этого ждёт алерт сундука
  const busy = ref(false);
  let seq = 0;

  const after = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

  const run = async () => {
    busy.value = true;
    for (let next = queue.shift(); next; next = queue.shift()) {
      current.value = { ...next, id: ++seq };
      phase.value = 'spinning';
      await after(ROULETTE_SPIN_ANIMATION_MS);
      phase.value = 'result';
      if (next.jackpotWon) {
        await after(JACKPOT_TAPE_MS);
        phase.value = 'jackpot';
        await after(ROULETTE_JACKPOT_SHOW_MS - JACKPOT_TAPE_MS);
      } else {
        await after(ROULETTE_RESULT_SHOW_MS);
      }
      current.value = null;
      // Короче паузы бота: следующее событие застаёт сцену свободной
      await after(ROULETTE_GAP_MS - 100);
    }
    busy.value = false;
  };

  const onSpin = (payload: RouletteSpinResultPayload) => {
    if (queue.length >= QUEUE_MAX) queue.shift();
    queue.push(payload);
    if (!busy.value) void run();
  };

  return { current, phase, busy, onSpin };
});
