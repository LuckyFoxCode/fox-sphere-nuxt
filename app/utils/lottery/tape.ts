// Ленты барабанов лотереи. Длина ленты фиксирована, поэтому анимации всё равно, сколько участников:
// их имена берутся по кругу из выборки, а когда имён мало, между ними встают значки.
// Лента сидом (id розыгрыша + место) воспроизводима: два открытых оверлея покажут одно и то же.

export const REEL_ITEM_H = 64;
// Карточек на ленте. Начало — заглушка «???», конец — победитель
export const REEL_LENGTH = 40;
// Меньше стольких чужих имён — между ними вставляются значки, иначе лента из трёх имён «читается» по кругу
export const REEL_DECO_BELOW = 10;

export type ReelItem =
  | { kind: 'mystery' }
  | { kind: 'name'; text: string }
  | { kind: 'deco'; icon: 'ticket' | 'crown' | 'star' };

export const hashSeed = (text: string): number => {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

// mulberry32: маленький сидируемый генератор [0, 1)
export const seededRandom = (seed: number): (() => number) => {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export const shuffled = <T>(items: readonly T[], random: () => number): T[] => {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
};

const DECO: ReelItem[] = [
  { kind: 'deco', icon: 'ticket' },
  { kind: 'deco', icon: 'star' },
  { kind: 'deco', icon: 'crown' },
];

// Лента из `length` карточек: [0] — заглушка, последняя — победитель. Остальные — чужие имена
// из `pool` по кругу; если их мало, между именами значки. Одинаковые карточки подряд не стоят.
export const buildReelTape = (
  pool: readonly string[],
  winner: string,
  seed: string,
  length = REEL_LENGTH,
): { items: ReelItem[]; stopIndex: number } => {
  const random = seededRandom(hashSeed(seed));
  const others = shuffled(
    [...new Set(pool)].filter((name) => name !== winner),
    random,
  );
  const useDeco = others.length < REEL_DECO_BELOW;

  const items: ReelItem[] = [{ kind: 'mystery' }];
  let nameCursor = 0;
  let decoCursor = Math.floor(random() * DECO.length);
  let wantDeco = useDeco;

  while (items.length < length - 1) {
    const previous = items[items.length - 1]!;
    const nextName = others.length ? others[nameCursor % others.length]! : null;
    if (wantDeco || nextName === null || (previous.kind === 'name' && previous.text === nextName)) {
      items.push(DECO[decoCursor++ % DECO.length]!);
      // С заглушкой имена идут через одно; без значков (много участников) значки не нужны
      wantDeco = false;
      continue;
    }
    items.push({ kind: 'name', text: nextName });
    nameCursor++;
    wantDeco = useDeco;
  }
  items.push({ kind: 'name', text: winner });
  return { items, stopIndex: items.length - 1 };
};

// Лента бегущей строки над барабанами: имена из выборки и значки между ними
export const buildStream = (pool: readonly string[], seed: string, length = 44): ReelItem[] => {
  const random = seededRandom(hashSeed(`${seed}:stream`));
  const names = shuffled([...new Set(pool)], random);
  const items: ReelItem[] = [];
  let cursor = 0;
  while (items.length < length) {
    items.push(names.length ? { kind: 'name', text: names[cursor++ % names.length]! } : { kind: 'deco', icon: 'ticket' });
    // Мало имён — значок после каждого: без этого лента из пяти имён повторялась бы сплошной стеной
    if (items.length < length && (names.length < REEL_DECO_BELOW || items.length % 3 === 0)) {
      items.push(DECO[items.length % DECO.length]!);
    }
  }
  return items;
};
