import { defineStore } from 'pinia';
import type { ChatMessagePayload, HeroChangedPayload } from '#shared/events';

// Зритель на полосе героев: данные для подписи над спрайтом и пузырь с его последним сообщением
export type ActiveHero = {
  userId: string;
  heroId: string;
  displayName: string;
  color: string;
  lvl: number;
  isBroadcaster: boolean;
  isBot: boolean;
  message?: string;
  emotes?: Record<string, string[]>;
};

// Как в старом fox-sphere: герой стоит на полосе 5 минут после последнего сообщения, пузырь — 8 секунд
export const HERO_TTL_MS = 5 * 60 * 1000;
export const HERO_MESSAGE_TTL_MS = 8000;

export const useHeroesStore = defineStore('heroes', () => {
  const heroes = ref(new Map<string, ActiveHero>());
  // Таймеры вне реактивного состояния и по userId: таймер, захвативший сырой объект, писал бы мимо
  // реактивного прокси, и пузырь не пропал бы. Поэтому в колбэке запись берётся из Map заново.
  const ttlTimers = new Map<string, ReturnType<typeof setTimeout>>();
  const messageTimers = new Map<string, ReturnType<typeof setTimeout>>();

  const remove = (userId: string) => {
    clearTimeout(ttlTimers.get(userId));
    clearTimeout(messageTimers.get(userId));
    ttlTimers.delete(userId);
    messageTimers.delete(userId);
    heroes.value.delete(userId);
  };

  const onMessage = (payload: ChatMessagePayload) => {
    // Без героя (сообщения бота, старые клиенты) на полосе делать нечего
    if (!payload.hero) return;
    const { userId } = payload;

    const fields = {
      heroId: payload.hero.heroId,
      displayName: payload.displayName,
      color: payload.color,
      lvl: payload.userLvl,
      isBroadcaster: payload.isBroadcaster,
      isBot: payload.isBot,
    };
    const existing = heroes.value.get(userId);
    if (existing) Object.assign(existing, fields);
    else heroes.value.set(userId, { userId, ...fields });

    clearTimeout(ttlTimers.get(userId));
    ttlTimers.set(userId, setTimeout(() => remove(userId), HERO_TTL_MS));

    const entry = heroes.value.get(userId);
    if (!entry) return;
    entry.message = payload.text;
    entry.emotes = payload.emotes;
    clearTimeout(messageTimers.get(userId));
    messageTimers.set(
      userId,
      setTimeout(() => {
        const expiring = heroes.value.get(userId);
        if (!expiring) return;
        expiring.message = undefined;
        expiring.emotes = undefined;
      }, HERO_MESSAGE_TTL_MS),
    );
  };

  // `!use`: зритель уже на полосе — меняем спрайт сразу. Если его там нет, он получит нового героя
  // со следующим сообщением: бот уже отдаёт его в `hero`.
  const onHeroChanged = (payload: HeroChangedPayload) => {
    const entry = heroes.value.get(payload.userId);
    if (entry) entry.heroId = payload.heroId;
  };

  const list = computed(() => [...heroes.value.values()]);

  return { list, onMessage, onHeroChanged };
});
