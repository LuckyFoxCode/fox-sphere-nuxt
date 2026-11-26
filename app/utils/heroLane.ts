// Мост между Vue-подписями героев и сценой Phaser. Подпись (HTML) и спрайт (Phaser) — разные миры:
// компонент говорит «этот зритель с этим героем», сцена рисует. Мост держит запросы в буфере,
// потому что сообщение чата может прийти раньше, чем Phaser загрузил спрайтшиты и создал сцену.
export type HeroLaneHost = {
  addHero: (userId: string, heroId: string) => void;
  attachLabel: (userId: string, label: HTMLElement) => void;
  removeHero: (userId: string) => void;
};

const requested = new Map<string, string>();
const labels = new Map<string, HTMLElement>();
// userId -> heroId, который сейчас в сцене. Именно пара, а не множество id: `!use` приходит с тем же
// userId и новым heroId, и множество проглотило бы смену, оставив старый спрайт.
const added = new Map<string, string>();
const generations = new Map<string, number>();

let host: HeroLaneHost | null = null;
let nextGeneration = 0;

const flush = (): void => {
  if (!host) return;

  for (const [userId, heroId] of requested) {
    // Тот же герой — ничего; другой — сцена сама снимает старый спрайт перед новым
    if (added.get(userId) !== heroId) {
      host.addHero(userId, heroId);
      added.set(userId, heroId);
    }
    const label = labels.get(userId);
    if (label) host.attachLabel(userId, label);
  }
};

export const setHeroLaneHost = (next: HeroLaneHost | null): void => {
  host = next;
  added.clear();
  flush();
};

// Занимает место героя и возвращает номер поколения. Зритель, замолчавший на TTL, может написать
// снова ещё во время ухода: смонтируется вторая подпись раньше, чем размонтируется первая, и
// без поколения уходящая сняла бы только что принятый спрайт.
export const spawnHero = (userId: string, heroId: string): number => {
  nextGeneration += 1;
  generations.set(userId, nextGeneration);
  requested.set(userId, heroId);
  flush();
  return nextGeneration;
};

export const attachHeroLabel = (userId: string, label: HTMLElement): void => {
  labels.set(userId, label);
  if (host && requested.has(userId)) host.attachLabel(userId, label);
};

// Устаревшее поколение игнорируется: вытесненный компонент не может убрать героя за собой
export const removeHero = (userId: string, generation?: number): void => {
  if (generation !== undefined && generations.get(userId) !== generation) return;

  generations.delete(userId);
  requested.delete(userId);
  labels.delete(userId);
  added.delete(userId);
  host?.removeHero(userId);
};
