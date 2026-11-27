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
