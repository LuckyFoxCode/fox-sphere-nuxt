// Картинки значков из тех же «вырубных наклеек», что и призы рулетки (app/utils/roulette/art.ts):
// сундуки и корона взяты оттуда как есть, колесо для спинов нарисовано теми же приёмами.
import { circle, ROULETTE_ART, sparkle, type ArtShape } from '~/utils/roulette/art';

const INK = '#2b2630';
const GOLD = '#ffd066';
const GOLD_SHADE = '#e79a35';
const PAPER = '#fff1bd';

const polar = (radius: number, angle: number): string =>
  `${(50 + radius * Math.sin(angle)).toFixed(2)} ${(54 - radius * Math.cos(angle)).toFixed(2)}`;

const wheel = (): ArtShape[] => [
  { d: circle(50, 54, 36), fill: GOLD_SHADE, width: 3 },
  ...Array.from({ length: 10 }, (_, index): ArtShape => {
    const from = (index / 10) * Math.PI * 2;
    const to = ((index + 1) / 10) * Math.PI * 2;
    return { d: `M50 54L${polar(29, from)}A29 29 0 0 1 ${polar(29, to)}Z`, fill: index % 2 === 0 ? GOLD : PAPER, width: 1.6, solid: false };
  }),
  { d: circle(50, 54, 29), stroke: INK, width: 2, solid: false },
  { d: circle(50, 54, 7.5), fill: '#ff7fb0', width: 2.2, solid: false },
  { d: circle(48, 52, 2.2), fill: '#fff', stroke: 'none', solid: false },
  // Указатель сверху
  { d: 'M50 24L41 6H59Z', fill: '#ff5f98', width: 2.5 },
  sparkle(90, 18, 10),
  sparkle(10, 84, 7),
];

export const ACHIEVEMENT_ART: Record<string, ArtShape[]> = {
  spins: wheel(),
  prize500: ROULETTE_ART.coins500,
  prize1000: ROULETTE_ART.coins1000,
  jackpot: ROULETTE_ART.jackpot,
};
