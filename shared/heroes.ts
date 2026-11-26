// Каталог героев: цены, характеристики и спрайтшиты. Данные перенесены из heroes.json старого fox-sphere. В БД лежит только `heroId` строкой (ViewerHero).
export type HeroSpriteSheet = {
  // Путь от корня сайта: файлы лежат в public/
  path: string;
  frames: number;
  frameRate: number;
  columns: number;
  rows: number;
};

export type HeroSpriteGeometry = {
  frameWidth: number;
  frameHeight: number;
  scale: number;
};

// Четыре стата есть у каждого героя; класс — это другие значения, а не другие поля.
// Читает пока только `speed` (скорость шага в Phaser): остальные нужны будущей карточке героя.
export type HeroStats = {
  health: number;
  attack: number;
  defense: number;
  speed: number;
};

export type HeroDefinition = HeroSpriteGeometry & {
  id: string;
  name: string;
  price: number;
  maxLevel: number;
  baseStats: HeroStats;
  growth: Omit<HeroStats, 'speed'>;
  idle: HeroSpriteSheet;
  walk: HeroSpriteSheet;
  // Вид спереди для круглых превью (карточка профиля): idle — три четверти и в маленьком кружке плох.
  // Без него берётся первый кадр idle.
  portrait?: HeroSpriteSheet;
};

type HeroCatalog = {
  sprites: HeroSpriteGeometry;
  heroes: Omit<HeroDefinition, keyof HeroSpriteGeometry>[];
};

// Данные из heroes.json старого fox-sphere. Новый герой — запись здесь и три картинки в public/assets/heroes/<id>/
const catalog: HeroCatalog = {
  sprites: {
    frameWidth: 480,
    frameHeight: 480,
    scale: 0.25
  },
  heroes: [
    {
      id: 'assassin',
      name: 'Assassin',
      price: 0,
      maxLevel: 50,
      baseStats: {
        health: 100,
        attack: 12,
        defense: 6,
        speed: 1.0
      },
      growth: {
        health: 9,
        attack: 1.2,
        defense: 0.6
      },
      idle: {
        path: 'assets/heroes/assassin/idle.webp',
        frames: 16,
        frameRate: 12,
        columns: 4,
        rows: 4
      },
      walk: {
        path: 'assets/heroes/assassin/walking.webp',
        frames: 20,
        frameRate: 16,
        columns: 4,
        rows: 5
      },
      portrait: {
        path: 'assets/heroes/assassin/front.webp',
        frames: 16,
        frameRate: 12,
        columns: 4,
        rows: 4
      }
    },
    {
      id: 'robber',
      name: 'Robber',
      price: 300,
      maxLevel: 50,
      baseStats: {
        health: 140,
        attack: 10,
        defense: 10,
        speed: 0.8
      },
      growth: {
        health: 14,
        attack: 1.0,
        defense: 1.0
      },
      idle: {
        path: 'assets/heroes/robber/idle.webp',
        frames: 16,
        frameRate: 12,
        columns: 4,
        rows: 4
      },
      walk: {
        path: 'assets/heroes/robber/walking.webp',
        frames: 20,
        frameRate: 16,
        columns: 4,
        rows: 5
      },
      portrait: {
        path: 'assets/heroes/robber/front.webp',
        frames: 16,
        frameRate: 12,
        columns: 4,
        rows: 4
      }
    },
    {
      id: 'thug',
      name: 'Thug',
      price: 800,
      maxLevel: 50,
      baseStats: {
        health: 80,
        attack: 18,
        defense: 3,
        speed: 1.25
      },
      growth: {
        health: 7,
        attack: 1.8,
        defense: 0.3
      },
      idle: {
        path: 'assets/heroes/thug/idle.webp',
        frames: 16,
        frameRate: 12,
        columns: 4,
        rows: 4
      },
      walk: {
        path: 'assets/heroes/thug/walking.webp',
        frames: 20,
        frameRate: 16,
        columns: 4,
        rows: 5
      },
      portrait: {
        path: 'assets/heroes/thug/front.webp',
        frames: 16,
        frameRate: 12,
        columns: 4,
        rows: 4
      }
    }
  ]
};

export const HEROES: readonly HeroDefinition[] = catalog.heroes.map((hero) => ({
  ...hero,
  ...catalog.sprites,
}));

export const DEFAULT_HERO_ID = HEROES[0]?.id ?? '';

const heroesById = new Map<string, HeroDefinition>(HEROES.map((hero) => [hero.id, hero]));

// Бесплатный герой, которого получает каждый новый зритель
export const getDefaultHero = (): HeroDefinition => {
  const hero = heroesById.get(DEFAULT_HERO_ID);
  if (!hero) throw new Error(`Героя по умолчанию "${DEFAULT_HERO_ID}" нет в каталоге`);
  return hero;
};

// Для отрисовки: id из БД, которого уже нет в каталоге, даёт героя по умолчанию, а не пустоту
export const getHeroById = (id: string): HeroDefinition => heroesById.get(id) ?? getDefaultHero();

// Для разбора команд: `getHeroById` на опечатку молча отдал бы героя по умолчанию, и
// `!buy hero tugg` «купил» бы его. Поэтому здесь неизвестное имя — undefined.
export const findHeroByTerm = (term: string): HeroDefinition | undefined => {
  const needle = term.trim().toLowerCase();
  return heroesById.get(needle) ?? HEROES.find((hero) => hero.name.toLowerCase() === needle);
};

export const isKnownHeroId = (id: string): boolean => heroesById.has(id);

const round2 = (value: number): number => Number(value.toFixed(2));

// Уровень 1 — базовые статы, каждый следующий добавляет шаг роста. Скорость не растёт.
export const getHeroStats = (id: string, level = 1): HeroStats => {
  const hero = getHeroById(id);
  const steps = Math.max(0, Math.floor(level) - 1);
  return {
    health: round2(hero.baseStats.health + hero.growth.health * steps),
    attack: round2(hero.baseStats.attack + hero.growth.attack * steps),
    defense: round2(hero.baseStats.defense + hero.growth.defense * steps),
    speed: hero.baseStats.speed,
  };
};
