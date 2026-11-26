// !pivo, перенесена из старого fox-sphere без изменений: шанс золота
// (packages/backend-shared/src/pivo.ts), кулдаун (twitch.constants.ts), ступени
// (packages/types/src/pivo/pivo.ts). Монет и XP команда не двигает: только текст в чат, а при
// золоте ещё и счётчик `Viewer.goldenBeers` с алертом. Бот и эмулятор берут константы отсюда.

export const PIVO_COOLDOWN_MS = 60_000;

// Веса = шансы ×10 (5% → 50), сумма 1000. Порядок ключей значим: по нему идёт выбор.
export const PIVO_OUTCOME_WEIGHTS = {
  regular: 950,
  golden: 50,
} as const;

export type PivoOutcome = keyof typeof PIVO_OUTCOME_WEIGHTS;

const PIVO_TOTAL_WEIGHT = Object.values(PIVO_OUTCOME_WEIGHTS).reduce((sum, w) => sum + w, 0);

// `rng(max)` — целое в [0, max). Бот передаёт crypto.randomInt, эмулятор — Math.random.
export const pickPivoOutcome = (rng: (maxExclusive: number) => number): PivoOutcome =>
  rng(PIVO_TOTAL_WEIGHT) < PIVO_OUTCOME_WEIGHTS.regular ? 'regular' : 'golden';

// Сколько вариантов у обычного пива (сами фразы — shared/i18n)
export const PIVO_MESSAGE_VARIANTS = 5;

// Ступени золотого пива: первая — сразу первое выбитое, дальше по счётчику.
// При шансе 5% это 20/40/80/140/260 ожидаемых попыток.
export const PIVO_TIER_THRESHOLDS = [1, 2, 4, 7, 13] as const;

// Подписи ступеней на алерте, по порядку ступеней
export const PIVO_TIER_LABELS = ['fresh', 'dark', 'aged', 'golden', 'legendary'] as const;

// 0 — ступени ещё нет; 1..5 — последняя достигнутая
export const getGoldenBeerTier = (goldenBeers: number): number => {
  let tier = 0;
  for (const threshold of PIVO_TIER_THRESHOLDS) {
    if (goldenBeers < threshold) break;
    tier += 1;
  }
  return tier;
};

export const goldenBeerTierLabel = (tier: number): string =>
  PIVO_TIER_LABELS[tier - 1] ?? PIVO_TIER_LABELS[0];

export const goldenBeerArtPath = (tier: number): string => `/assets/achievements/pivo/tier-${tier}.webp`;
