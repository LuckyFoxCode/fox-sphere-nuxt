// Ачивки не хранятся: каталог лежит в achievements.json, а ступень считается из счётчиков зрителя
// (Viewer.spinsCount и goldenBeers, WatchStreak, CoinHistory). Бот, оверлей, админка и будущий сайт
// берут отсюда одно и то же, поэтому пороги правятся в одном месте, а выдавать ничего не нужно.
import catalog from './achievements.json';

export type AchievementCounter = 'spins' | 'jackpots' | 'prize500' | 'prize1000' | 'bestStreak' | 'goldenBeers';

export type AchievementCounters = Record<AchievementCounter, number>;

// Какие записи CoinHistory считать: приз ровно 500 или 1000 бывает только у сегментов coins500 и
// coins1000 рулетки (рыбалка столько не даёт), джекпот пишется своей причиной
export const ACHIEVEMENT_COIN_RECORDS = {
  jackpots: { reason: 'JACKPOT' },
  prize500: { reason: 'SPIN_PRIZE', amount: 500 },
  prize1000: { reason: 'SPIN_PRIZE', amount: 1000 },
} as const;

export interface AchievementCategory {
  id: string;
  title: string;
  unit: string;
  counter: AchievementCounter;
  /** Значение счётчика, с которого берётся ступень 1, 2, 3 и так далее */
  thresholds: readonly number[];
  /** Чем меньше, тем реже категория: при равной ступени она идёт в профиле первой */
  priority: number;
  /** Готовая картинка вместо SVG-иконки; `{level}` и `{threshold}` подставляются */
  art?: string;
}

export const ACHIEVEMENT_CATEGORIES: readonly AchievementCategory[] = catalog.categories as AchievementCategory[];

/** Ступеней редкости пять: у категорий с большим числом порогов (стрик) они делятся поровну */
export const ACHIEVEMENT_RARITY_STEPS = 5;

/** Сколько значков показывает карточка профиля */
export const PROFILE_BADGE_SLOTS = 4;

export interface EarnedAchievement {
  category: string;
  /** 1..thresholds.length */
  level: number;
  /** 1..5: по ней выбираются значки профиля и цвет рамки */
  rarity: number;
  /** Значение счётчика */
  value: number;
}

// 0 — порог первой ступени ещё не взят
export const achievementLevel = (thresholds: readonly number[], value: number): number => {
  let level = 0;
  for (const threshold of thresholds) {
    if (value < threshold) break;
    level += 1;
  }
  return level;
};

export const achievementRarity = (level: number, levels: number): number =>
  Math.min(ACHIEVEMENT_RARITY_STEPS, Math.ceil((level * ACHIEVEMENT_RARITY_STEPS) / levels));

export const resolveAchievements = (counters: AchievementCounters): EarnedAchievement[] =>
  ACHIEVEMENT_CATEGORIES.flatMap((category) => {
    const value = counters[category.counter];
    const level = achievementLevel(category.thresholds, value);
    if (level === 0) return [];
    return [{ category: category.id, level, rarity: achievementRarity(level, category.thresholds.length), value }];
  });

const priorityOf = (id: string): number =>
  ACHIEVEMENT_CATEGORIES.find((category) => category.id === id)?.priority ?? Number.MAX_SAFE_INTEGER;

/** Самые редкие: выше ступень, при равной — более редкая категория */
export const pickProfileBadges = (earned: readonly EarnedAchievement[], slots = PROFILE_BADGE_SLOTS): EarnedAchievement[] =>
  [...earned]
    .sort((a, b) => b.rarity - a.rarity || priorityOf(a.category) - priorityOf(b.category))
    .slice(0, slots);

export const findCategory = (id: string): AchievementCategory | undefined =>
  ACHIEVEMENT_CATEGORIES.find((category) => category.id === id);

/** Картинка категории, если она готовая; null — рисуется SVG-иконка */
export const achievementArtPath = (category: AchievementCategory, level: number): string | null =>
  category.art
    ? category.art
        .replace('{level}', String(level))
        .replace('{threshold}', String(category.thresholds[level - 1] ?? ''))
    : null;
