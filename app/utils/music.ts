import type { MusicNowPlayingPayload } from '#shared/events';

// Чистая математика виджета «сейчас играет»: время, якорь позиции, решение о бегущей строке.

// Читатель шлёт сердцебиение раз в 15 секунд, три пропуска - это молчание. Бот о смерти читателя
// сам сообщает `null`, но и его состояние без таймеров может пролежать долго (оверлей открыли
// позже), поэтому протухание ловится здесь: и таймером, и по возрасту пришедшего состояния.
export const MUSIC_SILENCE_LIMIT_MS = 45_000;

// Сколько времени в пути имеет смысл учитывать. Всё, что больше, - часы разъехались или состояние
// пролежало без сердцебиения; доверять ему как «прошло пять минут» нельзя.
const MAX_TRAVEL_MS = 300_000;

const pad = (value: number): string => value.toString().padStart(2, '0');

/** `1:12`, `0:05`, `1:02:03`. Отрицательные значения читаются как ноль. */
export const formatTime = (ms: number): string => {
  const totalSeconds = Math.floor(Math.max(ms, 0) / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${minutes}:${pad(seconds)}`;
};

/**
 * Ехать ли тексту. Порог в один пиксель, а не `> 0`: субпиксельное округление иначе включает
 * анимацию на строке, которая визуально влезает целиком.
 */
export const shouldMarquee = (scrollWidth: number, clientWidth: number): boolean =>
  scrollWidth - clientWidth > 1;

export type PlaybackAnchor = { positionMs: number; atMs: number; isPlaying: boolean };

const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max);

/**
 * Якорь по пришедшему состоянию. `sentAt` поставлен ботом на той же машине, где крутится OBS, поэтому
 * его можно сравнивать с местными часами напрямую. Это же спасает ответ после перезагрузки сцены:
 * состояние может быть пятнадцатисекундной давности, и полоска встанет на место, а не откатится.
 */
export const anchorFrom = (state: MusicNowPlayingPayload, nowMs: number): PlaybackAnchor => {
  const travel = state.isPlaying ? clamp(nowMs - state.sentAt, 0, MAX_TRAVEL_MS) : 0;
  return { positionMs: state.positionMs + travel, atMs: nowMs, isPlaying: state.isPlaying };
};

/** Позиция на момент `nowMs`, зажатая в `[0, durationMs]`. */
export const positionAt = (anchor: PlaybackAnchor, nowMs: number, durationMs: number): number => {
  if (durationMs <= 0) return 0;
  const elapsed = anchor.isPlaying ? nowMs - anchor.atMs : 0;
  return clamp(anchor.positionMs + elapsed, 0, durationMs);
};
