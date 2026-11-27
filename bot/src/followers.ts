import type { ApiClient } from '@twurple/api';
import type { BotFollowers } from '../../shared/admin';
import { config } from './config';

const FOLLOWER_TTL = 6 * 60 * 60 * 1000; // фолловер остаётся фолловером надолго
const NON_FOLLOWER_TTL = 5 * 60 * 1000; // не-фолловер: перепроверяем, вдруг подписался

type Entry = { follower: boolean; until: number };

const LIST_TTL = 5 * 60 * 1000;

// Все фолловеры канала для админки, с датой подписки. Список держится 5 минут, чтобы каждое открытие
// раздела не листало Twitch заново. null — нет токена стримера
export const createFollowerList = (api: ApiClient, ensureBroadcaster: () => Promise<boolean>) => {
  let cached: { until: number; list: Promise<BotFollowers['followers']> } | undefined;

  const load = (): Promise<BotFollowers['followers']> =>
    api.asUser(config.streamerId, async (ctx) => {
      const pages = ctx.channels.getChannelFollowersPaginated(config.streamerId);
      const followers = await pages.getAll();
      // Без права moderator:read:followers Twitch отдаёт только число: пустой список был бы неправдой
      if (followers.length === 0 && (await pages.getTotalCount()) > 0) {
        throw new Error('у токена стримера нет права moderator:read:followers');
      }
      return followers.map((item) => ({ userId: item.userId, followedAt: item.followDate.toISOString() }));
    });

  return async (): Promise<BotFollowers['followers'] | null> => {
    if (!(await ensureBroadcaster())) return null;
    if (!cached || cached.until <= Date.now()) {
      const list = load();
      cached = { until: Date.now() + LIST_TTL, list };
      // Неудача не кэшируется
      list.catch(() => {
        if (cached?.list === list) cached = undefined;
      });
    }
    return cached.list;
  };
};

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
