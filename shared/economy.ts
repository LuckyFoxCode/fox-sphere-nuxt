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
