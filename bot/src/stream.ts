// XP стрима, как в старом fox-sphere (modules/stream/stream.service.ts): всё, что зритель получил
// за сообщение, прибавляется и стриму. Буст XP (в том числе автоматический после level-up) отложен.
import type { StreamStatePayload } from '../../shared/events';
import { buildStreamState, getStreamLevel } from '../../shared/xp';
import { prisma } from './db';

// Состояние стрима — одна строка SystemState
const STATE_ID = 1;

// Только чтение: пока строки нет, это первый уровень без XP
export const getStreamState = async (): Promise<StreamStatePayload> => {
  const row = await prisma.systemState.findUnique({ where: { id: STATE_ID } });
  return buildStreamState(row?.streamLevel ?? 1, row?.streamCurrentXp ?? 0);
};

export const addStreamXp = async (
  amount: number,
): Promise<{ state: StreamStatePayload; leveledUp: boolean }> => {
  // increment, а не «прочитал и записал»: сообщения обрабатываются параллельно
  const row = await prisma.systemState.upsert({
    where: { id: STATE_ID },
    create: { id: STATE_ID, streamCurrentXp: amount },
    update: { streamCurrentXp: { increment: amount } },
  });

  const lvl = getStreamLevel(row.streamLevel, row.streamCurrentXp);
  let leveledUp = false;
  if (lvl !== row.streamLevel) {
    // Условие по старому уровню: о переходе сообщит только одно из параллельных начислений
    const { count } = await prisma.systemState.updateMany({
      where: { id: STATE_ID, streamLevel: { lt: lvl } },
      data: { streamLevel: lvl },
    });
    leveledUp = count > 0;
  }
  return { state: buildStreamState(lvl, row.streamCurrentXp), leveledUp };
};
