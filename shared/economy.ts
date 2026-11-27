// Константы экономики (один канал → в коде, а не в БД). Значения из старого user.constants.ts.
export const COOLDOWNS = {
  XP_MESSAGE_COOLDOWN: 15 * 1000,
} as const;

export const XP_REWARDS = {
  DEFAULT: 1,
  SUBSCRIBER: 3,
  BROADCASTER: 3,
  FOLLOWER: 2, // пока не применяется: нужен Helix-запрос «подписан ли на канал» (этап 3)
  VIP_BONUS: 1,
  FOUNDER_BONUS: 1,
} as const;

// Буст XP (`!xpboost` и автоматический после level-up стрима): значения из старого
// stream.constants.ts. Множитель идёт и зрителю, и стриму за сообщение; минуты — для команды.
export const BOOST_CONFIG = {
  MULTIPLIER: 2,
  AUTO_MINUTES: 30,
  DEFAULT_MINUTES: 30,
  MIN_MINUTES: 5,
  MAX_MINUTES: 60,
} as const;

// Таймер на оверлее (`!timer`): без аргументов минута, предел — сутки (старый бот предела не имел)
export const TIMER_CONFIG = {
  DEFAULT_MINUTES: 1,
  MAX_MINUTES: 24 * 60,
} as const;

// Монет за сообщения нет намеренно (это абьюз): они приходят из стрима, рулетки, рыбалки,
// обмена баллов канала. За сообщение даётся только XP.

// Watch streak: награды на 3, 5, 7 и затем на каждом пятом от 10 (из старого user.constants.ts).
// XP и монеты растут линейно от значения стрика; если рубеж уже брали (WatchStreak), выплата вдвое меньше.
export const WATCH_STREAK_REWARD = {
  XP_PER_STREAK: 7,
  COINS_PER_STREAK: 100,
} as const;

export const isWatchStreakRewardLevel = (streak: number): boolean =>
  streak === 3 || streak === 5 || streak === 7 || (streak >= 10 && streak % 5 === 0);

export const watchStreakReward = (streak: number, isRepeat: boolean): { xp: number; coins: number } => {
  const divisor = isRepeat ? 2 : 1;
  return {
    xp: Math.floor((streak * WATCH_STREAK_REWARD.XP_PER_STREAK) / divisor),
    coins: Math.floor((streak * WATCH_STREAK_REWARD.COINS_PER_STREAK) / divisor),
  };
};

// Особые награды за баллы канала. Опознаются по id награды из Twitch (REWARD_STATS_ID, REWARD_LEADERBOARD_ID
// в .env бота) или, если id не заданы, по названию без учёта регистра. Остальные награды получают общий ответ.
export const SPECIAL_REWARD_TITLES = {
  stats: ['check my stats'],
  leaderboard: ['flex leaderboard'],
} as const;
export type SpecialReward = keyof typeof SPECIAL_REWARD_TITLES;

export const LEADERBOARD_TOP = 5;

export const matchSpecialReward = (
  reward: { id?: string; title: string },
  ids: Partial<Record<SpecialReward, string>> = {},
): SpecialReward | null => {
  const title = reward.title.trim().toLowerCase();
  for (const kind of Object.keys(SPECIAL_REWARD_TITLES) as SpecialReward[]) {
    const id = ids[kind];
    if (id) {
      if (reward.id === id) return kind;
      continue;
    }
    if ((SPECIAL_REWARD_TITLES[kind] as readonly string[]).includes(title)) return kind;
  }
  return null;
};

// Обмен баллов канала на монеты: три награды из старого бота, чем дороже пакет, тем выгоднее курс.
// Опознаются по id награды (REWARD_COIN_POUCH_ID и т. д. в .env бота) или, если id не задан, по названию без учёта регистра.
export const COIN_EXCHANGE_PACKAGES = {
  pouch: { title: 'Coin Pouch', points: 1000, coins: 1000 },
  chest: { title: 'Coin Chest', points: 3000, coins: 3900 },
  hoard: { title: "Poke Master's Hoard", points: 5000, coins: 7500 },
} as const;
export type CoinExchangeKind = keyof typeof COIN_EXCHANGE_PACKAGES;

export const matchCoinExchange = (
  reward: { id?: string; title: string },
  ids: Partial<Record<CoinExchangeKind, string>> = {},
): CoinExchangeKind | null => {
  const title = reward.title.trim().toLowerCase();
  for (const kind of Object.keys(COIN_EXCHANGE_PACKAGES) as CoinExchangeKind[]) {
    const id = ids[kind];
    if (id) {
      if (reward.id === id) return kind;
      continue;
    }
    if (COIN_EXCHANGE_PACKAGES[kind].title.toLowerCase() === title) return kind;
  }
  return null;
};
