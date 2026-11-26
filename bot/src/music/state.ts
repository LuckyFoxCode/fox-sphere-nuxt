import { isMusicNowPlayingPayload, type MusicNowPlayingPayload } from '../../../shared/events';

// Чистые функции «что играет»: разбор строки читателя и склейка состояний. Отдельно от процесса,
// чтобы их можно было проверить без Windows.

/**
 * Обложка приезжает только при смене трека: читатель шлёт её раз, а сердцебиение раз в 15 секунд с
 * ней же означало бы десятки мегабайт за вечер. Поэтому сердцебиение того же трека приходит с
 * `artwork: null`, и здесь к нему возвращается прежняя картинка. Иначе она пропадала бы с экрана
 * каждые 15 секунд, а ответ на `music:get-current` после перезагрузки сцены был бы без обложки.
 */
export const mergeNowPlaying = (
  previous: MusicNowPlayingPayload | null,
  next: MusicNowPlayingPayload | null,
): MusicNowPlayingPayload | null => {
  if (!next) return null;
  if (next.artwork !== null) return next;

  const sameTrack = previous !== null && previous.title === next.title && previous.artist === next.artist;
  if (!sameTrack || previous.artwork === null) return next;

  return { ...next, artwork: previous.artwork };
};

export type ReaderLine = { ok: true; state: MusicNowPlayingPayload | null } | { ok: false; reason: string };

/** Одна строка stdout читателя: `{"state": {...}}` или `{"state": null}`. */
export const parseReaderLine = (line: string): ReaderLine => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(line);
  } catch {
    return { ok: false, reason: 'не JSON' };
  }

  if (typeof parsed !== 'object' || parsed === null || !('state' in parsed)) {
    return { ok: false, reason: 'нет поля state' };
  }

  const state = (parsed as { state: unknown }).state;
  if (state === null) return { ok: true, state: null };
  if (!isMusicNowPlayingPayload(state)) return { ok: false, reason: 'состояние не прошло проверку' };

  return { ok: true, state };
};

/**
 * Режет поток stdout на строки: чанк может оборваться посреди строки (обложка в base64 весит
 * сотни килобайт), поэтому недописанный хвост ждёт следующего чанка.
 */
export const createLineSplitter = (onLine: (line: string) => void) => {
  let rest = '';

  return (chunk: string): void => {
    rest += chunk;
    let newline = rest.indexOf('\n');

    while (newline !== -1) {
      const line = rest.slice(0, newline).trim();
      rest = rest.slice(newline + 1);
      if (line) onLine(line);
      newline = rest.indexOf('\n');
    }
  };
};
