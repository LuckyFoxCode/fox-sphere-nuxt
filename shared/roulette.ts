// Рулетка, перенесена из старого fox-sphere: веса и призы (packages/backend-shared/src/roulette.ts),
// цена и банк (modules/roulette/roulette.constants.ts), тайминги и редкости (types, overlay/constants).
// Исход определяет только бот. Оверлей берёт отсюда каталог для картинок и ленты.

export const ROULETTE_PRICE = 100;
// Сколько с каждого спина уходит в банк
export const JACKPOT_SHARE = 10;
// С какой суммы банк начинает заново после джекпота
export const JACKPOT_SEED = 1000;
export const SPIN_COOLDOWN_MS = 30_000;
export const SPIN_STATS_COOLDOWN_MS = 5_000;

// Сколько крутится лента: столько же бот ждёт перед ответом в чат
export const ROULETTE_SPIN_ANIMATION_MS = 5000;
// Сколько держится результат после остановки, и сколько — экран джекпота
export const ROULETTE_RESULT_SHOW_MS = 4000;
export const ROULETTE_JACKPOT_SHOW_MS = 8000;
// Пауза между двумя вращениями: стикер успевает уйти
export const ROULETTE_GAP_MS = 400;

export type RoulettePrizeType = 'empty' | 'coins' | 'xp' | 'jackpot';

export type RoulettePrize = {
  prizeType: RoulettePrizeType;
  coinAmount: number;
  xpAmount: number;
};

// Веса = шансы ×10 (22,0% → 220, 0,1% → 1), сумма 1000. Порядок ключей значим: по нему идёт выбор.
export const ROULETTE_PRIZE_WEIGHTS = {
  empty: 220,
  coins60: 150,
  coins75: 60,
  coins100: 355,
  coins250: 80,
  coins500: 20,
  coins1000: 5,
  xp35: 75,
  xp100: 34,
  jackpot: 1,
} as const;

export type RouletteSegmentId = keyof typeof ROULETTE_PRIZE_WEIGHTS;

export const ROULETTE_PRIZES: Record<RouletteSegmentId, RoulettePrize> = {
  empty: { prizeType: 'empty', coinAmount: 0, xpAmount: 0 },
  coins60: { prizeType: 'coins', coinAmount: 60, xpAmount: 0 },
  coins75: { prizeType: 'coins', coinAmount: 75, xpAmount: 0 },
  coins100: { prizeType: 'coins', coinAmount: 100, xpAmount: 0 },
  coins250: { prizeType: 'coins', coinAmount: 250, xpAmount: 0 },
  coins500: { prizeType: 'coins', coinAmount: 500, xpAmount: 0 },
  coins1000: { prizeType: 'coins', coinAmount: 1000, xpAmount: 0 },
  xp35: { prizeType: 'xp', coinAmount: 0, xpAmount: 35 },
  xp100: { prizeType: 'xp', coinAmount: 0, xpAmount: 100 },
  // У джекпота нет своей суммы: выплата — весь банк
  jackpot: { prizeType: 'jackpot', coinAmount: 0, xpAmount: 0 },
};

export const ROULETTE_SEGMENT_IDS = Object.keys(ROULETTE_PRIZE_WEIGHTS) as RouletteSegmentId[];

export const ROULETTE_TOTAL_WEIGHT = Object.values(ROULETTE_PRIZE_WEIGHTS).reduce((sum, w) => sum + w, 0);

// `rng(max)` — целое в [0, max). Бот передаёт crypto.randomInt, лента оверлея — Math.random.
export const pickSegment = (rng: (maxExclusive: number) => number): RouletteSegmentId => {
  const roll = rng(ROULETTE_TOTAL_WEIGHT);
  let cumulative = 0;
  for (const id of ROULETTE_SEGMENT_IDS) {
    cumulative += ROULETTE_PRIZE_WEIGHTS[id];
    if (roll < cumulative) return id;
  }
  return 'jackpot';
};

// Приз из результата спина → сегмент ленты. Джекпот проверяется первым: его coinAmount — весь банк.
export const toSegmentId = ({ prizeType, coinAmount, xpAmount }: RoulettePrize): RouletteSegmentId => {
  if (prizeType === 'jackpot') return 'jackpot';
  const found = ROULETTE_SEGMENT_IDS.find((id) => {
    const prize = ROULETTE_PRIZES[id];
    return prize.prizeType === prizeType && prize.coinAmount === coinAmount && prize.xpAmount === xpAmount;
  });
  return found ?? 'empty';
};

// Проигрыш для статистики: не оборот ставок, а то, что спин не вернул. Джекпот всегда в плюсе.
export const spinLoss = ({ prizeType, coinAmount }: RoulettePrize): number =>
  prizeType === 'jackpot' ? 0 : Math.max(0, ROULETTE_PRICE - coinAmount);

export type RouletteRarity = 'empty' | 'common' | 'rare' | 'epic' | 'legendary' | 'jackpot';

// Редкость показывает ценность приза, а не шанс (поэтому самый частый coins100 — rare), как в старой
// рулетке. XP ценится на ступень ниже монет.
export const ROULETTE_SEGMENT_RARITY: Record<RouletteSegmentId, RouletteRarity> = {
  empty: 'empty',
  coins60: 'common',
  coins75: 'common',
  xp35: 'common',
  coins100: 'rare',
  xp100: 'rare',
  coins250: 'epic',
  coins500: 'legendary',
  coins1000: 'legendary',
  jackpot: 'jackpot',
};
