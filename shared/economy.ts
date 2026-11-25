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

// Монет за сообщения нет намеренно (это абьюз): они приходят из стрима, рулетки, рыбалки,
// обмена баллов канала. За сообщение даётся только XP.
