// Таймер `!timer`, как в старом fox-sphere: название, цвет и абсолютный момент окончания лежат
// в SystemState. Дедлайн, а не остаток, переживает и перезагрузку сцены OBS, и рестарт бота.
import { TIMER_COLORS, type TimerColor, type TimerPayload } from '../../shared/events';
import { prisma } from './db';
import { emitEvent } from './socket';

const STATE_ID = 1;

export const DEFAULT_TIMER_COLOR: TimerColor = 'blue';

export const isTimerColor = (value: string): value is TimerColor =>
  (TIMER_COLORS as readonly string[]).includes(value);

// Просроченный дедлайн — это отсутствие таймера: оверлей не должен получать `endsAt` в прошлом
// и рисовать нули вместо пустоты. Незнакомый цвет (опечатка в старой строке) падает на цвет
// по умолчанию, а не отдаёт оверлею несуществующий вариант.
export const getActiveTimer = async (): Promise<TimerPayload | null> => {
  const row = await prisma.systemState.findUnique({ where: { id: STATE_ID } });
  if (!row?.timerTitle || !row.timerEndsAt || row.timerEndsAt.getTime() <= Date.now()) return null;
  return {
    title: row.timerTitle,
    color: row.timerColor && isTimerColor(row.timerColor) ? row.timerColor : DEFAULT_TIMER_COLOR,
    endsAt: row.timerEndsAt.getTime(),
  };
};

// Запись до события: «запущен» значит «сохранён и разослан»
export const startTimer = async (input: {
  minutes: number;
  color: TimerColor;
  title: string;
}): Promise<TimerPayload> => {
  const endsAt = new Date(Date.now() + Math.round(input.minutes * 60_000));
  const data = { timerTitle: input.title, timerColor: input.color, timerEndsAt: endsAt };
  await prisma.systemState.upsert({
    where: { id: STATE_ID },
    create: { id: STATE_ID, ...data },
    update: data,
  });
  const timer = { title: input.title, color: input.color, endsAt: endsAt.getTime() };
  emitEvent('twitch:timer', timer);
  return timer;
};

export const stopTimer = async (): Promise<void> => {
  const data = { timerTitle: null, timerColor: null, timerEndsAt: null };
  await prisma.systemState.upsert({
    where: { id: STATE_ID },
    create: { id: STATE_ID, ...data },
    update: data,
  });
  emitEvent('twitch:timer-stop');
};
