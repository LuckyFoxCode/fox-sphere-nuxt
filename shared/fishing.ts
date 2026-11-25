// Рыбалка, перенесена из старого fox-sphere без изменений: веса и уловы
// (packages/backend-shared/src/fishing.ts), тайминги (modules/fishing/fishing.constants.ts).
// Исход определяет только бот. Эмулятор (/dev/events) берёт отсюда те же уловы.
import type { FishMessages } from './i18n/types';

export const FISH_COOLDOWN_MS = 60_000;
// Поклёвка приходит сама, через случайное время в этих пределах (включительно)
export const FISH_BITE_DELAY_MIN_MS = 10_000;
export const FISH_BITE_DELAY_MAX_MS = 30_000;

// `empty` — «сорвалась», `bank` — сундук: игрок не получает ничего, монеты уходят в банк рулетки
export type FishCatchType = 'empty' | 'coins' | 'xp' | 'bank';

export type FishCatch = {
  catchType: FishCatchType;
  coinAmount: number;
  xpAmount: number;
  bankAmount: number;
};

// Веса = шансы ×10 (22% → 220, 0,8% → 8), сумма 1000. Порядок ключей значим: по нему идёт выбор.
export const FISH_CATCH_WEIGHTS = {
  empty: 220,
  coins25: 300,
  coins70: 100,
  coins100: 8,
  xp20: 250,
  xp40: 97,
  bank200: 25,
} as const;

export type FishCatchId = keyof typeof FISH_CATCH_WEIGHTS;

export const FISH_CATCHES: Record<FishCatchId, FishCatch> = {
  empty: { catchType: 'empty', coinAmount: 0, xpAmount: 0, bankAmount: 0 },
  coins25: { catchType: 'coins', coinAmount: 25, xpAmount: 0, bankAmount: 0 },
  coins70: { catchType: 'coins', coinAmount: 70, xpAmount: 0, bankAmount: 0 },
  coins100: { catchType: 'coins', coinAmount: 100, xpAmount: 0, bankAmount: 0 },
  xp20: { catchType: 'xp', coinAmount: 0, xpAmount: 20, bankAmount: 0 },
  xp40: { catchType: 'xp', coinAmount: 0, xpAmount: 40, bankAmount: 0 },
  bank200: { catchType: 'bank', coinAmount: 0, xpAmount: 0, bankAmount: 200 },
};

export const FISH_CATCH_IDS = Object.keys(FISH_CATCH_WEIGHTS) as FishCatchId[];

export const FISH_TOTAL_WEIGHT = Object.values(FISH_CATCH_WEIGHTS).reduce((sum, w) => sum + w, 0);

// `rng(max)` — целое в [0, max). Бот передаёт crypto.randomInt, эмулятор — Math.random.
export const pickCatch = (rng: (maxExclusive: number) => number): FishCatchId => {
  const roll = rng(FISH_TOTAL_WEIGHT);
  let cumulative = 0;
  for (const id of FISH_CATCH_IDS) {
    cumulative += FISH_CATCH_WEIGHTS[id];
    if (roll < cumulative) return id;
  }
  return 'bank200';
};

// Сколько вариантов у текстов улова монет и «сорвалась» (сами фразы — shared/i18n)
export const FISH_MESSAGE_VARIANTS = 3;

// `variant` выбирает фразу для монет и «сорвалась»; у XP и сундука фраза одна
export const fishCatchMessage = (
  texts: FishMessages,
  caught: FishCatch,
  name: string,
  variant: number,
): string => {
  const index = variant % FISH_MESSAGE_VARIANTS;
  switch (caught.catchType) {
    case 'coins':
      return (texts.coins[index] ?? texts.coins[0])(name, caught.coinAmount);
    case 'xp':
      return texts.xp(name, caught.xpAmount);
    case 'bank':
      return texts.bank(name, caught.bankAmount);
    // «Сорвалась» — отдельный исход, а не промах зрителя
    case 'empty':
      return (texts.empty[index] ?? texts.empty[0])(name);
  }
};
