// Таймер `!timer`, как в старом fox-sphere: название, цвет и абсолютный момент окончания лежат
// в SystemState. Дедлайн, а не остаток, переживает и перезагрузку сцены OBS, и рестарт бота.
import { TIMER_CONFIG } from '../../shared/economy';
import { TIMER_COLORS, type TimerColor, type TimerPayload } from '../../shared/events';
import { prisma } from './db';
import { emitEvent } from './socket';

const STATE_ID = 1;

export const DEFAULT_TIMER_COLOR: TimerColor = 'blue';

export const isTimerColor = (value: string): value is TimerColor =>
  (TIMER_COLORS as readonly string[]).includes(value);

// Просроченный дедлайн — это отсутствие таймера: оверлей не должен получать `endsAt` в прошлом
// и рисовать нули вместо пустоты. Незнакомый цвет (опечатка в старой строке) падает на цвет
// по умолчанию, а не отдаёт оверлею несуществующий вариант. Таймер на паузе хранит остаток
// (`timerPausedLeftMs`), а не дедлайн: часы не идут, поэтому он не «просрочивается».
export const getActiveTimer = async (): Promise<TimerPayload | null> => {
  const row = await prisma.systemState.findUnique({ where: { id: STATE_ID } });
  if (!row?.timerTitle) return null;
  const color = row.timerColor && isTimerColor(row.timerColor) ? row.timerColor : DEFAULT_TIMER_COLOR;
  if (row.timerPausedLeftMs) {
    return {
      title: row.timerTitle,
      color,
      endsAt: Date.now() + row.timerPausedLeftMs,
      pausedLeftMs: row.timerPausedLeftMs,
    };
  }
  if (!row.timerEndsAt || row.timerEndsAt.getTime() <= Date.now()) return null;
  return { title: row.timerTitle, color, endsAt: row.timerEndsAt.getTime() };
};

// Запись до события: «запущен» значит «сохранён и разослан»
const save = async (data: {
  timerTitle: string | null;
  timerColor: string | null;
  timerEndsAt: Date | null;
  timerPausedLeftMs: number | null;
}): Promise<void> => {
  await prisma.systemState.upsert({
    where: { id: STATE_ID },
    create: { id: STATE_ID, ...data },
    update: data,
  });
};

export const startTimer = async (input: {
  minutes: number;
  color: TimerColor;
  title: string;
}): Promise<TimerPayload> => {
  const endsAt = new Date(Date.now() + Math.round(input.minutes * 60_000));
  await save({ timerTitle: input.title, timerColor: input.color, timerEndsAt: endsAt, timerPausedLeftMs: null });
  const timer = { title: input.title, color: input.color, endsAt: endsAt.getTime() };
  emitEvent('twitch:timer', timer);
  return timer;
};

export const stopTimer = async (): Promise<void> => {
  await save({ timerTitle: null, timerColor: null, timerEndsAt: null, timerPausedLeftMs: null });
  emitEvent('twitch:timer-stop');
};

// Пауза, продолжение и ±минута из пульта. Каждая правка работает с тем, что сейчас на экране
// (`getActiveTimer`), и возвращает null, если править нечего или правка невозможна: решает пульт.
const write = async (timer: TimerPayload): Promise<TimerPayload> => {
  const paused = timer.pausedLeftMs !== undefined;
  await save({
    timerTitle: timer.title,
    timerColor: timer.color,
    timerEndsAt: paused ? null : new Date(timer.endsAt),
    timerPausedLeftMs: timer.pausedLeftMs ?? null,
  });
  emitEvent('twitch:timer', timer);
  return timer;
};

export const pauseTimer = async (): Promise<TimerPayload | null> => {
  const timer = await getActiveTimer();
  if (!timer || timer.pausedLeftMs !== undefined) return null;
  const left = Math.max(1, timer.endsAt - Date.now());
  return write({ ...timer, endsAt: Date.now() + left, pausedLeftMs: left });
};

export const resumeTimer = async (): Promise<TimerPayload | null> => {
  const timer = await getActiveTimer();
  if (!timer || timer.pausedLeftMs === undefined) return null;
  return write({ title: timer.title, color: timer.color, endsAt: Date.now() + timer.pausedLeftMs });
};

// Меньше минуты не остаётся и больше суток не набирается: на ноль таймер останавливает «Стоп»
export const adjustTimer = async (deltaMinutes: 1 | -1): Promise<TimerPayload | null> => {
  const timer = await getActiveTimer();
  if (!timer) return null;
  const left = (timer.pausedLeftMs ?? timer.endsAt - Date.now()) + deltaMinutes * 60_000;
  if (left < 1000 || left > TIMER_CONFIG.MAX_MINUTES * 60_000) return null;
  return write(
    timer.pausedLeftMs !== undefined
      ? { ...timer, endsAt: Date.now() + left, pausedLeftMs: left }
      : { title: timer.title, color: timer.color, endsAt: Date.now() + left },
  );
};
