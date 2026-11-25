import type { ApiClient } from '@twurple/api';

// Бейджи чата: Helix отдаёт картинки по паре «набор:версия» (moderator:1, subscriber:12…).
// Кэш заполняется один раз при старте; пока он пуст или бейджа в нём нет, берём прямой адрес CDN.
export const createBadgeResolver = (api: ApiClient, broadcasterId: string) => {
  const cache = new Map<string, string>();

  const load = async () => {
    try {
      const sets = [
        ...(await api.chat.getGlobalBadges()),
        ...(broadcasterId ? await api.chat.getChannelBadges(broadcasterId) : []),
      ];
      for (const set of sets) {
        for (const version of set.versions) cache.set(`${set.id}:${version.id}`, version.getImageUrl(2));
      }
      console.log(`[chat] бейджей загружено: ${cache.size}`);
    } catch (error) {
      console.error('[chat] не удалось загрузить бейджи Twitch, использую запасные адреса:', error);
    }
  };

  const urls = (badges: Map<string, string>): string[] =>
    [...badges].map(
      ([id, version]) =>
        cache.get(`${id}:${version}`) ?? `https://static-cdn.jtvnw.net/badges/v1/${id}/${version}/1`,
    );

  return { load, urls };
};
