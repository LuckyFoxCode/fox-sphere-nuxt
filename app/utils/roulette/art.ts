// Картинки призов: рисованные «вырубные наклейки» в квадрате 100×100. Каждая фигура описана один раз,
// RouletteArt сначала обводит силуэт овсяным кантом, потом рисует сами фигуры поверх.
import type { RouletteSegmentId } from '#shared/roulette';

export interface ArtShape {
  d: string;
  fill?: string;
  stroke?: string;
  width?: number;
  dash?: string;
  /** false — деталь внутри силуэта: в кант не входит и своей обводки не имеет */
  solid?: boolean;
}

const INK = '#2b2630';
const GOLD = '#ffd066';
const GOLD_SHADE = '#e79a35';
const GOLD_LIGHT = '#fff1bd';
const WOOD = '#a9654a';
const WOOD_SHADE = '#7f4636';
const MUTED = '#8b8394';

const circle = (cx: number, cy: number, r: number): string =>
  `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0Z`;

const ellipse = (cx: number, cy: number, rx: number, ry: number): string =>
  `M${cx - rx} ${cy}a${rx} ${ry} 0 1 0 ${rx * 2} 0a${rx} ${ry} 0 1 0 ${-rx * 2} 0Z`;

// Четырёхлучевая искра
const spark = (cx: number, cy: number, r: number): string => {
  const k = r * 0.28;
  return `M${cx} ${cy - r}L${cx + k} ${cy - k}L${cx + r} ${cy}L${cx + k} ${cy + k}L${cx} ${cy + r}L${cx - k} ${cy + k}L${cx - r} ${cy}L${cx - k} ${cy - k}Z`;
};

const sparkle = (cx: number, cy: number, r: number, fill = GOLD_LIGHT): ArtShape => ({
  d: spark(cx, cy, r),
  fill,
  width: 1.5,
});

// Лисья лапа — клеймо на монетах
const paw = (cx: number, cy: number, s: number, fill: string): ArtShape[] =>
  [
    ellipse(cx, cy + 0.28 * s, 0.42 * s, 0.34 * s),
    ellipse(cx - 0.5 * s, cy - 0.1 * s, 0.17 * s, 0.22 * s),
    ellipse(cx - 0.19 * s, cy - 0.42 * s, 0.17 * s, 0.23 * s),
    ellipse(cx + 0.19 * s, cy - 0.42 * s, 0.17 * s, 0.23 * s),
    ellipse(cx + 0.5 * s, cy - 0.1 * s, 0.17 * s, 0.22 * s),
  ].map((d) => ({ d, fill, solid: false }));

// Монета лицом: гурт, диск, блик и клеймо
const coin = (cx: number, cy: number, r: number): ArtShape[] => [
  { d: circle(cx, cy, r), fill: GOLD_SHADE },
  { d: circle(cx, cy, r * 0.74), fill: GOLD, width: 1.5 },
  {
    d: `M${cx - r * 0.84} ${cy - r * 0.18}A${r * 0.86} ${r * 0.86} 0 0 1 ${cx - r * 0.1} ${cy - r * 0.85}`,
    stroke: GOLD_LIGHT,
    width: Math.max(2, r * 0.11),
    solid: false,
  },
  ...paw(cx, cy + r * 0.04, r * 0.66, GOLD_SHADE),
];

// Монета плашмя в стопке
const disc = (cx: number, cy: number, rx = 17): ArtShape[] => [
  {
    d: `M${cx - rx} ${cy}v6a${rx} 6.5 0 0 0 ${rx * 2} 0v-6Z`,
    fill: GOLD_SHADE,
    width: 2,
  },
  { d: ellipse(cx, cy, rx, 6.5), fill: GOLD, width: 2 },
  { d: ellipse(cx, cy, rx * 0.55, 2.8), stroke: GOLD_LIGHT, width: 1.5, solid: false },
];

const gem = (cx: number, cy: number, s: number, fill: string): ArtShape[] => [
  {
    d: `M${cx - s} ${cy - s * 0.35}L${cx - s * 0.5} ${cy - s}H${cx + s * 0.5}L${cx + s} ${cy - s * 0.35}L${cx} ${cy + s}Z`,
    fill,
    width: 2,
  },
  {
    d: `M${cx - s * 0.55} ${cy - s * 0.4}L${cx - s * 0.28} ${cy - s * 0.72}`,
    stroke: '#ffffff',
    width: 1.8,
    solid: false,
  },
];

const bolt = (cx: number, cy: number, s: number): ArtShape[] => [
  {
    d: `M${cx + 0.12 * s} ${cy - s}L${cx - 0.62 * s} ${cy + 0.14 * s}H${cx - 0.1 * s}L${cx - 0.24 * s} ${cy + s}L${cx + 0.64 * s} ${cy - 0.22 * s}H${cx + 0.1 * s}L${cx + 0.46 * s} ${cy - s}Z`,
    fill: GOLD,
  },
  {
    d: `M${cx + 0.08 * s} ${cy - 0.76 * s}L${cx - 0.34 * s} ${cy - 0.08 * s}`,
    stroke: GOLD_LIGHT,
    width: 3,
    solid: false,
  },
];

const hexagon = (cx: number, cy: number, r: number): string => {
  const w = r * 0.87;
  return `M${cx} ${cy - r}L${cx + w} ${cy - r / 2}V${cy + r / 2}L${cx} ${cy + r}L${cx - w} ${cy + r / 2}V${cy - r / 2}Z`;
};

const crystal = (r: number, body: string, inner: string): ArtShape[] => [
  { d: hexagon(50, 50, r), fill: body },
  { d: hexagon(50, 50, r - 8), fill: inner, width: 1.5 },
];

// Раскрытый сундук: откинутая крышка с накладками, монеты горкой, короб с окантовкой и замком
const chestLid: ArtShape[] = [
  { d: 'M12 36C12 18 22 11 32 11H68C78 11 88 18 88 36Z', fill: WOOD },
  { d: 'M12 29H88V37H12Z', fill: GOLD_SHADE, width: 2 },
  { d: 'M27 13V29M73 13V29', stroke: GOLD_SHADE, width: 5, solid: false },
  { d: 'M16 37H84L81 60H19Z', fill: WOOD_SHADE, width: 2 },
];
const chestBody: ArtShape[] = [
  { d: 'M14 60H86V83Q86 89 80 89H20Q14 89 14 83Z', fill: WOOD },
  { d: 'M14 60H86V68H14Z', fill: GOLD_SHADE, width: 2 },
  { d: 'M27 68V89M73 68V89', stroke: GOLD_SHADE, width: 5, solid: false },
  { d: 'M43 64H57V76Q57 80 50 82Q43 80 43 76Z', fill: GOLD, width: 2 },
  { d: circle(50, 71, 2.6), fill: INK, solid: false },
];

export const ROULETTE_ART: Record<RouletteSegmentId, ArtShape[]> = {
  // Монета-призрак и моль: в кошельке пусто
  empty: [
    { d: circle(44, 56, 27), fill: '#37313f', stroke: MUTED, width: 2.5, dash: '6 5' },
    ...paw(44, 57, 18, '#4d4657'),
    { d: 'M66 30C58 12 82 8 74 27Z', fill: '#c7bcd0', width: 2 },
    { d: 'M74 30C92 20 96 42 77 35Z', fill: '#c7bcd0', width: 2 },
    { d: ellipse(71, 33, 4.5, 8), fill: MUTED, width: 2 },
    { d: 'M69 26L64 20M74 26L77 19', stroke: MUTED, width: 2, solid: false },
    { d: 'M64 44Q57 50 60 56', stroke: MUTED, width: 2, dash: '2 5', solid: false },
  ],
  coins60: [...coin(50, 52, 30), sparkle(80, 24, 8)],
  coins75: [...coin(37, 42, 23), ...coin(61, 60, 27), sparkle(76, 24, 8)],
  coins100: [
    ...disc(34, 74, 20),
    ...disc(34, 63, 20),
    ...disc(34, 52, 20),
    ...disc(34, 41, 20),
    ...coin(65, 59, 24),
    sparkle(68, 22, 9),
  ],
  // Мешок монет
  coins250: [
    { d: 'M37 32L30 17Q36 20 41 15Q46 21 50 14Q55 21 60 15Q64 20 71 17L63 32Z', fill: '#d9a868' },
    { d: 'M37 32H63C78 41 86 55 85 68C84 82 70 87 50 87S16 82 15 68C14 55 22 41 37 32Z', fill: '#e8bd7e' },
    { d: 'M70 46C78 55 80 66 76 74', stroke: '#c98f4f', width: 5, solid: false },
    { d: 'M35 30H65V37H35Z', fill: '#8a5b45', width: 2 },
    ...coin(47, 62, 16),
    ...coin(79, 76, 13),
    ...disc(22, 80, 12),
    ...disc(22, 72, 12),
    sparkle(83, 30, 8),
  ],
  // Сундук
  coins500: [
    ...chestLid,
    { d: 'M18 61Q22 43 36 48Q44 35 56 44Q72 37 82 61Z', fill: GOLD },
    ...coin(33, 51, 11),
    ...coin(66, 50, 11),
    ...coin(50, 45, 12),
    ...chestBody,
    sparkle(90, 14, 9),
    sparkle(9, 47, 6),
  ],
  // Сундук через край: самоцветы и летящие монеты
  coins1000: [
    ...chestLid,
    { d: 'M15 61Q14 40 30 43Q38 22 52 33Q68 22 74 41Q90 39 85 61Z', fill: GOLD },
    ...coin(29, 49, 12),
    ...coin(71, 47, 12),
    ...coin(40, 36, 10),
    ...gem(55, 40, 13, '#7be0ff'),
    ...chestBody,
    ...coin(11, 82, 10),
    ...coin(91, 77, 9),
    ...gem(84, 57, 7, '#ff7fb0'),
    ...coin(9, 18, 8),
    sparkle(91, 13, 10),
    sparkle(52, 4, 6),
  ],
  xp35: [...crystal(38, '#5aa896', '#bfeee0'), ...bolt(50, 50, 27)],
  xp100: [
    ...crystal(42, '#4d84d8', '#c3dcff'),
    ...bolt(37, 54, 21),
    ...bolt(60, 47, 29),
    sparkle(86, 20, 9),
    sparkle(13, 76, 7),
  ],
  // Корона на горе монет
  jackpot: [
    { d: 'M9 82Q14 62 30 66Q38 52 52 62Q66 50 73 66Q89 63 92 82Q70 92 50 92T9 82Z', fill: GOLD_SHADE },
    ...coin(24, 76, 12),
    ...coin(77, 76, 12),
    ...coin(51, 78, 13),
    { d: 'M23 62L16 24L35 39L50 12L65 39L84 24L77 62Z', fill: GOLD },
    { d: 'M23 55H77V65Q50 71 23 65Z', fill: GOLD_SHADE },
    { d: 'M28 50L25 37', stroke: GOLD_LIGHT, width: 3.5, solid: false },
    ...gem(50, 45, 9, '#ff5f98'),
    ...gem(33, 49, 5.5, '#7be0ff'),
    ...gem(67, 49, 5.5, '#7be0ff'),
    { d: circle(16, 22, 5), fill: '#ff5f98', width: 2 },
    { d: circle(50, 11, 5.5), fill: '#7be0ff', width: 2 },
    { d: circle(84, 22, 5), fill: '#ff5f98', width: 2 },
    sparkle(90, 48, 8, '#ffffff'),
    sparkle(10, 49, 6, '#ffffff'),
  ],
};
