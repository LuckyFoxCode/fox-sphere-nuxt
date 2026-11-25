// Оформление редкостей карточек рулетки. Редкость сегмента задана в shared/roulette.ts.
// Рамка, текстура и анимации по редкостям — в стилях RouletteCard (селекторы .rarity-*).
import { ROULETTE_PRIZES, ROULETTE_SEGMENT_RARITY, type RouletteRarity, type RouletteSegmentId } from '#shared/roulette';

export interface RarityStyle {
  label: string;
  /** Основной цвет редкости: лента, свечение, текстура */
  accent: string;
  /** Ромбики под названием: чем реже, тем больше */
  pips: number;
  /** Искры, мерцающие на карточке */
  twinkles: number;
  /** Частицы, разлетающиеся при выигрыше */
  burst: number;
}

export const RARITY_STYLES: Record<RouletteRarity, RarityStyle> = {
  empty: { label: 'empty', accent: '#8b8394', pips: 0, twinkles: 0, burst: 0 },
  common: { label: 'common', accent: '#8fc9b8', pips: 1, twinkles: 0, burst: 10 },
  rare: { label: 'rare', accent: '#6aa8ff', pips: 2, twinkles: 1, burst: 14 },
  epic: { label: 'epic', accent: '#c47bff', pips: 3, twinkles: 3, burst: 20 },
  legendary: { label: 'legendary', accent: '#ffb52e', pips: 4, twinkles: 5, burst: 28 },
  jackpot: { label: 'jackpot', accent: '#ff5f98', pips: 5, twinkles: 7, burst: 40 },
};

export interface SegmentView {
  id: RouletteSegmentId;
  rarity: RouletteRarity;
  style: RarityStyle;
  /** Крупная надпись на карточке */
  value: string;
  unit: string;
}

export const segmentView = (id: RouletteSegmentId): SegmentView => {
  const prize = ROULETTE_PRIZES[id];
  const rarity = ROULETTE_SEGMENT_RARITY[id];
  const text = {
    empty: { value: '—', unit: 'nothing' },
    coins: { value: String(prize.coinAmount), unit: 'coins' },
    xp: { value: `+${prize.xpAmount}`, unit: 'xp' },
    jackpot: { value: 'BANK', unit: 'take it all' },
  }[prize.prizeType];
  return { id, rarity, style: RARITY_STYLES[rarity], ...text };
};
