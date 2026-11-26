import type { TimerColor } from '#shared/events';

// Бумага тайлов цифр по цвету, который стример выбрал в `!timer 5 red BRB`. Классы записаны
// строками целиком: Tailwind ищет их в исходниках текстом, `bg-paper-${color}` дал бы пустой CSS.
export const TIMER_PAPER: Record<TimerColor, string> = {
  amber: 'bg-paper-amber',
  blue: 'bg-paper-blue',
  cyan: 'bg-paper-cyan',
  purple: 'bg-paper-purple',
  red: 'bg-paper-red',
  rose: 'bg-paper-rose',
};

// Цифры на тайлах, по символу на тайл: `ММ:СС`, а от часа `ЧЧ:ММ` (как в старом оверлее)
export const timerDigits = (totalSeconds: number): string[] => {
  const pad = (value: number) => String(value).padStart(2, '0');
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return (totalSeconds >= 3600 ? `${pad(hours)}:${pad(minutes)}` : `${pad(minutes)}:${pad(seconds)}`).split('');
};

// Громкость звука окончания (из старого fox-sphere); точнее настраивается в микшере OBS
export const TIMER_SOUND = '/assets/sound/timer-off.wav';
export const TIMER_SOUND_VOLUME = 0.5;
