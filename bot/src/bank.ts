// Банк рулетки — SystemState.jackpotTotal. Пока строки нет, в банке стартовая сумма.
import type { JackpotPayload } from '../../shared/events';
import { JACKPOT_SEED } from '../../shared/roulette';
import { prisma } from './db';
import { emitEvent } from './socket';

const STATE_ID = 1;

// Только чтение
export const getJackpot = async (): Promise<JackpotPayload> => {
  const row = await prisma.systemState.findUnique({ where: { id: STATE_ID } });
  return { jackpotTotal: row?.jackpotTotal ?? JACKPOT_SEED };
};

// Пока крутится лента, шапка банк не обновляет: в базе он уже посчитан со спином, и после
// джекпота пополнение показало бы результат до остановки. После остановки банк шлёт сама рулетка.
let displayHeld = false;
export const holdBankDisplay = (held: boolean): void => {
  displayHeld = held;
};

// Пополнение банка не из рулетки (улов рыбалки): сразу видно в шапке. Монеты никому
// не списываются и в CoinHistory не пишутся, как в старом боте.
export const addToBank = async (amount: number): Promise<number> => {
  if (!Number.isInteger(amount) || amount <= 0) throw new Error(`в банк можно добавить только целое > 0, не ${amount}`);
  const { jackpotTotal } = await prisma.systemState.upsert({
    where: { id: STATE_ID },
    create: { id: STATE_ID, jackpotTotal: JACKPOT_SEED + amount },
    update: { jackpotTotal: { increment: amount } },
  });
  if (!displayHeld) emitEvent('stream:jackpot-updated', { jackpotTotal });
  return jackpotTotal;
};
