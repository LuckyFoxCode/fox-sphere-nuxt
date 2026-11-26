// Очередь вращений: на сцене одна лента. Следующий спин начинается, когда оверлей убрал предыдущий.
// Это же защищает банк от гонки двух одновременных спинов.
import type { RouletteSpinResultPayload } from '../../shared/events';
import {
  ROULETTE_GAP_MS,
  ROULETTE_JACKPOT_SHOW_MS,
  ROULETTE_RESULT_SHOW_MS,
  ROULETTE_SPIN_ANIMATION_MS,
} from '../../shared/roulette';
import { holdBankDisplay } from './bank';
import { emitEvent } from './socket';

// Сцена на экране одна: вращения рулетки и лотерея идут через одну очередь, и ничто не показывается
// поверх другого. Задача очереди сама ловит свои ошибки: упавшая не должна останавливать остальные.
let tail: Promise<void> = Promise.resolve();
export const onStage = (job: () => Promise<void>): void => {
  tail = tail.then(job).catch((error: unknown) => console.error('[stage] задача сцены упала:', error));
};

export const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export type PlaySpin = (
  // Определяет исход (настоящий спин пишет в базу, эмулятор отдаёт готовый)
  spin: () => Promise<RouletteSpinResultPayload>,
  // Вызывается в момент остановки ленты: банк, XP, ответ в чат
  onStop: (result: RouletteSpinResultPayload) => Promise<void>,
) => Promise<void>;

export const createSpinStage = (): PlaySpin => {
  return (spin, onStop) =>
    new Promise<void>((resolve, reject) => {
      onStage(async () => {
        try {
          // С этого момента и до остановки ленты банк в шапке не меняется
          holdBankDisplay(true);
          const result = await spin();
          emitEvent('roulette:spin-result', result);
          await sleep(ROULETTE_SPIN_ANIMATION_MS);
          holdBankDisplay(false);
          // Показ результата отсчитывается от остановки, а не от конца ответа в чат
          const shown = sleep(
            (result.jackpotWon ? ROULETTE_JACKPOT_SHOW_MS : ROULETTE_RESULT_SHOW_MS) + ROULETTE_GAP_MS,
          );
          await onStop(result).then(resolve, reject);
          await shown;
        } catch (error) {
          // Спин не состоялся: сцена свободна для следующего
          holdBankDisplay(false);
          reject(error);
        }
      });
    });
};
