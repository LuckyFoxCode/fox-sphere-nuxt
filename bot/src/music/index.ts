import { spawn, type ChildProcess } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import type { MusicNowPlayingPayload } from '../../../shared/events';
import { createLineSplitter, mergeNowPlaying, parseReaderLine } from './state';

// «Сейчас играет»: бот сам запускает читателя (reader.ps1) дочерним процессом. Читатель берёт
// системную медиасессию Windows - то, что Brave сообщает системе, - и печатает состояние в stdout.
// Отдельной программы, планировщика, токена и HTTP здесь нет: бот и плеер на одной машине.

const READER_PATH = fileURLToPath(new URL('./reader.ps1', import.meta.url));

// Состояние живёт только в памяти: это не история, и в базу его писать незачем. После перезапуска
// бота виджет гаснет и ждёт следующей строки читателя (не позже сердцебиения, 15 с).
let current: MusicNowPlayingPayload | null = null;

export const getNowPlaying = (): MusicNowPlayingPayload | null => current;

// Паузы между перезапусками читателя: сразу после падения, потом всё реже, до 30 с
const RESTART_DELAYS_MS = [1_000, 2_000, 5_000, 10_000, 30_000];
// Читатель, проработавший дольше этого, считается здоровым: счётчик падений обнуляется
const HEALTHY_AFTER_MS = 60_000;

type MusicReader = { stop: () => void };

type MusicReaderOptions = {
  /** Новое состояние. `null` - скрыть виджет. */
  onState: (state: MusicNowPlayingPayload | null) => void;
};

const isDisabled = (): boolean => process.env.MUSIC_ENABLED === 'false';

export const startMusicReader = ({ onState }: MusicReaderOptions): MusicReader => {
  const noop: MusicReader = { stop: () => {} };

  if (isDisabled()) {
    console.log('[music] выключен (MUSIC_ENABLED=false)');
    return noop;
  }
  if (process.platform !== 'win32') {
    // Системные медиасессии читаются только в Windows; на Mac виджет просто не оживёт
    console.log(`[music] виджет работает только на Windows (здесь ${process.platform}), читатель не запущен`);
    return noop;
  }

  let child: ChildProcess | null = null;
  let stopped = false;
  let failures = 0;
  let restartTimer: ReturnType<typeof setTimeout> | null = null;

  const publish = (state: MusicNowPlayingPayload | null) => {
    current = mergeNowPlaying(current, state);
    onState(current);
  };

  const spawnReader = () => {
    if (stopped) return;
    const startedAt = Date.now();

    // Именно Windows PowerShell 5.1: WinRT-типы (GSMTC) в pwsh 7 не загружаются
    const proc = spawn(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', READER_PATH],
      {
        windowsHide: true,
        stdio: ['ignore', 'pipe', 'pipe'],
        env: { ...process.env, MUSIC_PARENT_PID: String(process.pid) },
      },
    );
    child = proc;

    let rejected = 0;
    const splitter = createLineSplitter((line) => {
      const result = parseReaderLine(line);
      if (result.ok) return publish(result.state);
      // Лог не должен тонуть: про брак пишем первые три раза
      if (++rejected <= 3) console.error(`[music] строка читателя отброшена (${result.reason})`);
    });

    proc.stdout.setEncoding('utf8');
    proc.stdout.on('data', splitter);
    proc.stderr.setEncoding('utf8');
    proc.stderr.on('data', (text: string) => {
      for (const line of text.split('\n')) if (line.trim()) console.log(`[music] ${line.trim()}`);
    });

    proc.on('error', (error) => {
      console.error('[music] не удалось запустить powershell.exe:', error.message);
    });

    proc.on('close', (code) => {
      if (child === proc) child = null;
      if (stopped) return;

      // Читателя нет - показывать больше нечего: не оставляем на экране последний трек
      if (current) publish(null);

      if (Date.now() - startedAt > HEALTHY_AFTER_MS) failures = 0;
      const delay = RESTART_DELAYS_MS[Math.min(failures, RESTART_DELAYS_MS.length - 1)]!;
      failures++;
      console.error(`[music] читатель завершился (код ${code ?? '?'}), перезапуск через ${delay / 1000} с`);
      restartTimer = setTimeout(spawnReader, delay);
    });
  };

  spawnReader();
  console.log('[music] читатель запущен');

  return {
    stop: () => {
      stopped = true;
      if (restartTimer) clearTimeout(restartTimer);
      child?.kill();
      child = null;
    },
  };
};
