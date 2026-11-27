import { matchSpecialReward, type SpecialReward } from '../../shared/economy';
import type { RewardRedeemPayload } from '../../shared/events';

// Двухстрочная настройка в .env бота: id награды из Twitch надёжнее названия, которое можно переименовать
const rewardIds = (): Partial<Record<SpecialReward, string>> => ({
  stats: process.env.REWARD_STATS_ID || undefined,
  leaderboard: process.env.REWARD_LEADERBOARD_ID || undefined,
});

export const specialRewardOf = (reward: RewardRedeemPayload): SpecialReward | null =>
  matchSpecialReward({ id: reward.rewardId, title: reward.rewardTitle }, rewardIds());
