import { defineStore } from 'pinia';
import type { MusicNowPlayingPayload } from '#shared/events';
import type { OverlaySocket } from '~/plugins/socket.client';
import type { PlaybackAnchor } from '~/utils/music';

// «Сейчас играет». null - виджет скрыт: ничего не играет, бот сказал `null` или давно нет вестей.
export const useMusicStore = defineStore('music', () => {
  const state = ref<MusicNowPlayingPayload | null>(null);
  const positionMs = ref(0);
  const durationMs = ref(0);
  const isPlaying = ref(false);

  let anchor: PlaybackAnchor | null = null;
  let silenceTimer: ReturnType<typeof setTimeout> | null = null;
  let rafId: number | null = null;

  const stopLoop = () => {
    if (rafId !== null) cancelAnimationFrame(rafId);
    rafId = null;
  };

  // Позиция считается от якоря по часам, а не накручивается счётчиком: скрытая вкладка OBS,
  // вернувшись, показывает правильное место, а не отставшее.
  const tick = () => {
    if (!anchor) {
      rafId = null;
      return;
    }
    positionMs.value = positionAt(anchor, Date.now(), durationMs.value);
    rafId = requestAnimationFrame(tick);
  };

  const clear = () => {
    if (silenceTimer) clearTimeout(silenceTimer);
    silenceTimer = null;
    stopLoop();
    anchor = null;
    state.value = null;
    positionMs.value = 0;
    durationMs.value = 0;
    isPlaying.value = false;
  };

  const onUpdate = (next: MusicNowPlayingPayload | null) => {
    if (!next) return clear();

    // Ответ на запрос после перезагрузки сцены отдаёт то, что бот держит в памяти, а таймеров у него
    // нет: читатель мог умереть полчаса назад. Такое состояние хуже пустого экрана - на нём
    // застывшая полоска и «пауза», которой нет.
    if (Date.now() - next.sentAt > MUSIC_SILENCE_LIMIT_MS) return clear();

    state.value = next;
    durationMs.value = next.durationMs;
    isPlaying.value = next.isPlaying;
    anchor = anchorFrom(next, Date.now());
    positionMs.value = positionAt(anchor, Date.now(), next.durationMs);

    // На паузе позиция стоит и кадры тратить не на что: цикл проснётся на следующем событии
    stopLoop();
    if (next.isPlaying) rafId = requestAnimationFrame(tick);

    if (silenceTimer) clearTimeout(silenceTimer);
    silenceTimer = setTimeout(clear, MUSIC_SILENCE_LIMIT_MS);
  };

  // Запрос при каждом подключении: живое событие уже улетело, а состояние нужно сразу
  const sync = (socket: OverlaySocket) => {
    socket.emit('music:get-current', onUpdate);
  };

  return { state, positionMs, durationMs, isPlaying, onUpdate, sync };
});
