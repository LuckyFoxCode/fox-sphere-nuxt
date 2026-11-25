// Сундук алерта по слоям, чтобы крышку можно было открыть: те же «вырубные наклейки», что у картинок
// рулетки (utils/roulette/art.ts), но крупнее и с отдельными закрытой и откинутой крышкой.
// Поле 200×160: короб 40…160 по горизонтали, 92…150 по вертикали, петли крышки на высоте 76.
import { circle, coin, gem, type ArtShape } from '~/utils/roulette/art';

const INK = '#2b2630';
const GOLD = '#ffd066';
const GOLD_SHADE = '#e79a35';
const GOLD_LIGHT = '#fff1bd';
const WOOD = '#a9654a';
const WOOD_LIGHT = '#cd8a68';
const WOOD_SHADE = '#7f4636';
const LINING = '#5d3145';

// Откинутая крышка (видна изнутри) и тёмное нутро короба
export const CHEST_LID_OPEN: ArtShape[] = [
  { d: 'M46 76C36 40 52 16 78 16H122C148 16 164 40 154 76Z', fill: WOOD },
  { d: 'M58 69C52 42 63 28 82 28H118C137 28 148 42 142 69Z', fill: LINING, width: 2 },
  { d: 'M72 19V28M128 19V28', stroke: GOLD_SHADE, width: 8, solid: false },
  { d: 'M44 68H156V78H44Z', fill: GOLD_SHADE, width: 2 },
  { d: 'M40 93L46 77H154L160 93Z', fill: '#3c2330', width: 2 },
];

// Золото горкой: появляется, когда крышка откинута
export const CHEST_HEAP: ArtShape[] = [
  { d: 'M45 96Q48 74 68 79Q78 56 98 68Q118 52 132 76Q152 72 155 96Z', fill: GOLD },
  ...coin(65, 85, 12),
  ...coin(136, 84, 12),
  ...coin(100, 73, 15),
  ...gem(120, 83, 10, '#7be0ff'),
  ...gem(81, 86, 8, '#ff7fb0'),
];

export const CHEST_BODY: ArtShape[] = [
  { d: 'M40 92H160V138Q160 150 148 150H52Q40 150 40 138Z', fill: WOOD },
  { d: 'M42 124H158', stroke: WOOD_SHADE, width: 3, solid: false },
  { d: 'M40 92H160V104H40Z', fill: GOLD_SHADE, width: 2 },
  { d: 'M62 104V148M138 104V148', stroke: GOLD_SHADE, width: 10, solid: false },
  { d: circle(62, 98, 2.6), fill: GOLD_LIGHT, solid: false },
  { d: circle(138, 98, 2.6), fill: GOLD_LIGHT, solid: false },
  { d: 'M85 97H115V117Q115 129 100 133Q85 129 85 117Z', fill: GOLD },
  { d: circle(100, 111, 4), fill: INK, solid: false },
  { d: 'M100 112V122', stroke: INK, width: 3.5, solid: false },
];

export const CHEST_LID_CLOSED: ArtShape[] = [
  { d: 'M40 93C40 62 56 46 78 46H122C144 46 160 62 160 93Z', fill: WOOD },
  { d: 'M45 67H155', stroke: WOOD_SHADE, width: 3, solid: false },
  { d: 'M52 62Q60 52 74 52', stroke: WOOD_LIGHT, width: 3.5, solid: false },
  { d: 'M40 81H160V93H40Z', fill: GOLD_SHADE, width: 2 },
  { d: 'M62 51V81M138 51V81', stroke: GOLD_SHADE, width: 10, solid: false },
  { d: 'M89 78H111V96Q100 104 89 96Z', fill: GOLD, width: 2 },
  { d: circle(100, 89, 3), fill: INK, solid: false },
];
