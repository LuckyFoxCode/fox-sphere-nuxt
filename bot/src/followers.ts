import type { ApiClient } from '@twurple/api';
import { config } from './config';

const FOLLOWER_TTL = 6 * 60 * 60 * 1000; // фолловер остаётся фолловером надолго
const NON_FOLLOWER_TTL = 5 * 60 * 1000; // не-фолловер: перепроверяем, вдруг подписался

type Entry = { follower: boolean; until: number };

// Один канал: ключ кэша — twitchId зрителя (карта живёт в процессе и денег не хранит).
export const createFollowerChecker = (api: ApiClient, ensureBroadcaster: () => Promise<boolean>) => {
  const cache = new Map<string, Entry>();
  let warnedNoToken = false;

  return async (twitchId: string): Promise<boolean> => {
    const hit = cache.get(twitchId);
    if (hit && hit.until > Date.now()) return hit.follower;

    if (!(await ensureBroadcaster())) {
      if (!warnedNoToken) {
        console.warn('[follow] нет токена стримера: бонус фолловера отключён. Откройте /auth/twitch/broadcaster/login');
        warnedNoToken = true;
      }
      return false; // не кэшируем: токен может появиться
    }

    try {
      // Нужен moderator:read:followers на токене стримера
      const res = await api.asUser(config.streamerId, (ctx) =>
        ctx.channels.getChannelFollowers(config.streamerId, twitchId),
      );
      const follower = res.data.length > 0;
      cache.set(twitchId, {
        follower,
        until: Date.now() + (follower ? FOLLOWER_TTL : NON_FOLLOWER_TTL),
      });
      return follower;
    } catch (error) {
      console.error(`[follow] не удалось проверить фолловера ${twitchId}:`, error);
      cache.set(twitchId, { follower: false, until: Date.now() + 60_000 });
      return false;
    }
  };
};
