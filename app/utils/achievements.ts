// Оформление ачивок: пять ступеней редкости берут цвета карточек рулетки (app/utils/roulette/rarity.ts),
// чтобы значок и приз одной редкости читались одинаково.
import type { RouletteRarity } from '#shared/roulette';
import { RARITY_STYLES } from '~/utils/roulette/rarity';

export const ACHIEVEMENT_RARITIES: readonly RouletteRarity[] = ['common', 'rare', 'epic', 'legendary', 'jackpot'];

export const achievementAccent = (rarity: number): string =>
  RARITY_STYLES[ACHIEVEMENT_RARITIES[Math.min(Math.max(rarity, 1), 5) - 1]!].accent;

export const achievementRarityLabel = (rarity: number): string =>
  RARITY_STYLES[ACHIEVEMENT_RARITIES[Math.min(Math.max(rarity, 1), 5) - 1]!].label;

const INK = '#2b2630';
const GOLD = '#ffd066';
const GOLD_SHADE = '#e79a35';
const GOLD_LIGHT = '#fff1bd';
const PAPER = '#f4e8d4';

export const ICON_COLORS = { INK, GOLD, GOLD_SHADE, GOLD_LIGHT, PAPER } as const;

const polar = (radius: number, angle: number): string =>
  `${(50 + radius * Math.sin(angle)).toFixed(2)} ${(50 - radius * Math.cos(angle)).toFixed(2)}`;

/** Колесо рулетки: восемь клиньев через один золотых и бумажных */
export const WHEEL_WEDGES: readonly { d: string; fill: string }[] = Array.from({ length: 8 }, (_, index) => {
  const from = (index / 8) * Math.PI * 2;
  const to = ((index + 1) / 8) * Math.PI * 2;
  return {
    d: `M50 52L${polar(25, from)}A25 25 0 0 1 ${polar(25, to)}Z`,
    fill: index % 2 === 0 ? GOLD : PAPER,
  };
});

/** Камни по кругу рамки: на 3-й ступени четыре, с 4-й восемь */
export const rimGems = (rarity: number): { x: number; y: number; r: number }[] => {
  if (rarity < 3) return [];
  const count = rarity >= 4 ? 8 : 4;
  return Array.from({ length: count }, (_, index) => {
    const angle = (index / count) * Math.PI * 2;
    return { x: 50 + 45 * Math.sin(angle), y: 50 - 45 * Math.cos(angle), r: index % (count / 4) === 0 ? 4.6 : 3.2 };
  });
};

// Оправа значка: у категорий отсюда своя форма, фон и движение (AchievementGem.vue), остальные рисуются круглой медалью
export type AchievementFrame = 'arch' | 'hex' | 'shield' | 'pennant';

export const ACHIEVEMENT_FRAMES: Readonly<Record<string, AchievementFrame>> = {
  'tower-floor': 'arch',
  'tower-boss': 'hex',
  'hero-level': 'shield',
  'tower-squad': 'pennant',
};
