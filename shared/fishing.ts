// Рыбалка, перенесена из старого fox-sphere без изменений: веса и уловы
// (packages/backend-shared/src/fishing.ts), тайминги и тексты (modules/fishing/fishing.constants.ts).
// Исход определяет только бот. Эмулятор (/dev/events) берёт отсюда те же уловы и тексты.

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

// Сколько вариантов у текстов улова и «сорвалась»
export const FISH_MESSAGE_VARIANTS = 3;

type Variants = [(name: string) => string, ...((name: string) => string)[]];
type CoinVariants = [(name: string, coins: number) => string, ...((name: string, coins: number) => string)[]];

// «Сорвалась» — отдельный исход, а не промах зрителя
const BITE_EMPTY: Variants = [
  (name) => `🎣 @${name} — клюёт, и тут сорвалась с крючка!`,
  (name) => `🎣 @${name} — клюёт было, да на крючке оказалось пусто…`,
  (name) => `🎣 @${name} — дёрнуло, леска порвалась, улов ушёл`,
];

const BITE_COINS: CoinVariants = [
  (name, coins) => `🎣 @${name} — клюёт и вылавливает! +${coins} монет`,
  (name, coins) => `🎣 @${name} — вытащил рыбу на +${coins} монет!`,
  (name, coins) => `🎣 @${name} — на крючке рыба, +${coins} монет 🎉`,
];

export const fishCastMessage = (name: string): string => `@${name} забросил удочку…`;

export const fishAlreadyMessage = (name: string): string => `@${name}, ты уже рыбачишь`;

export const fishCooldownMessage = (name: string, secondsLeft: number): string =>
  `⏳ @${name}, удочка не готова — через ${secondsLeft}s`;

// `variant` выбирает фразу для монет и «сорвалась»; у XP и сундука фраза одна
export const fishCatchMessage = (caught: FishCatch, name: string, variant: number): string => {
  switch (caught.catchType) {
    case 'coins':
      return (BITE_COINS[variant % BITE_COINS.length] ?? BITE_COINS[0])(name, caught.coinAmount);
    case 'xp':
      return `⚡ @${name} — клюёт! Выловил +${caught.xpAmount} XP`;
    // Сундук не платит игроку: текст не должен читаться как личная выплата
    case 'bank':
      return `🎣 @${name} — клюёт! Вытащил сундук: ${caught.bankAmount} монет ушли в джекпот`;
    case 'empty':
      return (BITE_EMPTY[variant % BITE_EMPTY.length] ?? BITE_EMPTY[0])(name);
  }
};
