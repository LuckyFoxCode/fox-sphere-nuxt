import { matchCoinExchange, matchSpecialReward, type CoinExchangeKind, type SpecialReward } from '../../shared/economy';
import type { RewardRedeemPayload } from '../../shared/events';

// Двухстрочная настройка в .env бота: id награды из Twitch надёжнее названия, которое можно переименовать
const rewardIds = (): Partial<Record<SpecialReward, string>> => ({
  stats: process.env.REWARD_STATS_ID || undefined,
  leaderboard: process.env.REWARD_LEADERBOARD_ID || undefined,
});

export const specialRewardOf = (reward: RewardRedeemPayload): SpecialReward | null =>
  matchSpecialReward({ id: reward.rewardId, title: reward.rewardTitle }, rewardIds());

const exchangeIds = (): Partial<Record<CoinExchangeKind, string>> => ({
  pouch: process.env.REWARD_COIN_POUCH_ID || undefined,
  chest: process.env.REWARD_COIN_CHEST_ID || undefined,
  hoard: process.env.REWARD_COIN_HOARD_ID || undefined,
});

export const coinExchangeOf = (reward: RewardRedeemPayload): CoinExchangeKind | null =>
  matchCoinExchange({ id: reward.rewardId, title: reward.rewardTitle }, exchangeIds());
