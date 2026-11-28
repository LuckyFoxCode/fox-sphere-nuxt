// Картинки значков из тех же «вырубных наклеек», что и призы рулетки (app/utils/roulette/art.ts):
// сундуки и корона взяты оттуда как есть, колесо для спинов нарисовано теми же приёмами.
import { circle, ROULETTE_ART, sparkle, type ArtShape } from '~/utils/roulette/art';

const INK = '#2b2630';
const GOLD = '#ffd066';
const GOLD_SHADE = '#e79a35';
const PAPER = '#fff1bd';
const GOLD_LIGHT = '#fff1bd';

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

const STONE = '#b7a9c9';
const BONE = '#f7eedd';

// Башня: каменный ярус с зубцами, флаг, дверь и бойницы
const tower = (): ArtShape[] => [
  { d: 'M24 44V26H34V33H43V26H57V33H66V26H76V44Z', fill: STONE, width: 3 },
  { d: 'M30 90V44H70V90Z', fill: STONE, width: 3 },
  { d: 'M44 90V74A6 6 0 0 1 56 74V90Z', fill: INK, stroke: INK, width: 2, solid: false },
  { d: 'M47 54H53V64H47Z', fill: INK, stroke: INK, width: 1.5, solid: false },
  { d: 'M30 70H70', stroke: INK, width: 1.6, dash: '4 3', solid: false },
  { d: 'M50 26V6', stroke: INK, width: 2.5 },
  { d: 'M50 7L69 13L50 20Z', fill: '#ff5f98', width: 2.2 },
  sparkle(86, 30, 9),
  sparkle(12, 70, 7),
];

// Череп босса в золотой короне
const bossSkull = (): ArtShape[] => [
  { d: circle(50, 50, 27), fill: BONE, width: 3 },
  { d: 'M36 68H64V82Q64 87 59 87H41Q36 87 36 82Z', fill: BONE, width: 3 },
  { d: 'M44 76V87M50 76V87M56 76V87', stroke: INK, width: 2, solid: false },
  { d: circle(40, 50, 7), fill: INK, stroke: INK, width: 1, solid: false },
  { d: circle(60, 50, 7), fill: INK, stroke: INK, width: 1, solid: false },
  { d: circle(40, 50, 2.4), fill: '#ff5f98', stroke: 'none', solid: false },
  { d: circle(60, 50, 2.4), fill: '#ff5f98', stroke: 'none', solid: false },
  { d: 'M50 58L45 66H55Z', fill: INK, stroke: INK, width: 1, solid: false },
  { d: 'M30 28L35 10L44 21L50 6L56 21L65 10L70 28Z', fill: GOLD, width: 2.6 },
  sparkle(88, 22, 8),
  sparkle(12, 78, 7),
];

// Щит со стрелкой вверх: уровень героя
const levelShield = (): ArtShape[] => [
  { d: 'M50 8L84 21V50C84 73 67 87 50 94C33 87 16 73 16 50V21Z', fill: '#8fc9b8', width: 3 },
  { d: 'M50 19L74 28V50C74 67 62 78 50 84C38 78 26 67 26 50V28Z', fill: GOLD_LIGHT, stroke: INK, width: 2, solid: false },
  { d: 'M50 30L64 48H56V66H44V48H36Z', fill: GOLD, stroke: INK, width: 2.4, solid: false },
  sparkle(88, 14, 8),
  sparkle(10, 86, 7),
];

// Три героя плечом к плечу
const squad = (): ArtShape[] => [
  { d: 'M10 92Q10 72 28 72Q46 72 46 92Z', fill: '#e08aa4', width: 2.6 },
  { d: circle(28, 56, 14), fill: '#dba97a', width: 2.6 },
  { d: 'M54 92Q54 72 72 72Q90 72 90 92Z', fill: '#8fc9b8', width: 2.6 },
  { d: circle(72, 56, 14), fill: '#dba97a', width: 2.6 },
  { d: 'M26 92Q26 64 50 64Q74 64 74 92Z', fill: GOLD_SHADE, width: 2.8 },
  { d: circle(50, 44, 17), fill: '#e9bf94', width: 2.8 },
  { d: 'M13 53A15 15 0 0 1 43 53Q28 45 13 53Z', fill: '#42527a', stroke: INK, width: 2, solid: false },
  { d: 'M57 52Q72 45 87 52V57Q72 50 57 57Z', fill: '#e04f5f', stroke: INK, width: 2, solid: false },
  { d: 'M33 43A17 17 0 0 1 67 43Q50 35 33 43Z', fill: '#9aa3b5', stroke: INK, width: 2, solid: false },
  { d: circle(44, 45, 2), fill: INK, stroke: 'none', solid: false },
  { d: circle(56, 45, 2), fill: INK, stroke: 'none', solid: false },
  sparkle(88, 20, 8),
];

export const ACHIEVEMENT_ART: Record<string, ArtShape[]> = {
  spins: wheel(),
  prize500: ROULETTE_ART.coins500,
  prize1000: ROULETTE_ART.coins1000,
  jackpot: ROULETTE_ART.jackpot,
  'tower-floor': tower(),
  'tower-boss': bossSkull(),
  'hero-level': levelShield(),
  'tower-squad': squad(),
};
