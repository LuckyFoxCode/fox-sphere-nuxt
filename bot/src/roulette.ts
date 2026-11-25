// Спин рулетки в базе, перенесён из старого fox-sphere (modules/roulette/roulette.service.ts):
// исход выбирает бот, всё списывается и начисляется одной транзакцией.
import { randomInt } from 'node:crypto';
import type { RouletteSpinResultPayload } from '../../shared/events';
import {
  JACKPOT_SEED,
  JACKPOT_SHARE,
  pickSegment,
  ROULETTE_PRICE,
  ROULETTE_PRIZES,
  spinLoss,
  type RouletteSegmentId,
} from '../../shared/roulette';
import { prisma } from './db';

const STATE_ID = 1;

export class NotEnoughCoinsError extends Error {}

type SpinInput = { viewerId: number; twitchId: string; username: string };

// `roll` подменяется только в проверках; в бою — криптостойкий выбор по весам
export const runSpin = async (
  { viewerId, twitchId, username }: SpinInput,
  roll: () => RouletteSegmentId = () => pickSegment(randomInt),
): Promise<RouletteSpinResultPayload> => {
  const prize = ROULETTE_PRIZES[roll()];

  const outcome = await prisma.$transaction(async (tx) => {
    // Списание с условием достаточности: баланс мог измениться, пока спин ждал очереди
    const debited = await tx.viewer.updateMany({
      where: { id: viewerId, coins: { gte: ROULETTE_PRICE } },
      data: {
        coins: { decrement: ROULETTE_PRICE },
        spinsCount: { increment: 1 },
        totalLoss: { increment: spinLoss(prize) },
      },
    });
    if (debited.count === 0) throw new NotEnoughCoinsError(`у зрителя ${username} не хватает монет на спин`);

    await tx.coinHistory.create({ data: { viewerId, amount: -ROULETTE_PRICE, reason: 'SPIN' } });

    // Взнос в банк идёт до выплаты: джекпот забирает банк вместе с ним
    const { jackpotTotal: bankAfterShare } = await tx.systemState.upsert({
      where: { id: STATE_ID },
      create: { id: STATE_ID, jackpotTotal: JACKPOT_SEED + JACKPOT_SHARE },
      update: { jackpotTotal: { increment: JACKPOT_SHARE } },
    });

    const jackpotWon = prize.prizeType === 'jackpot';
    const coinAmount = jackpotWon ? bankAfterShare : prize.coinAmount;

    if (coinAmount > 0) {
      await tx.viewer.update({
        where: { id: viewerId },
        data: { coins: { increment: coinAmount }, totalWin: { increment: coinAmount } },
      });
      await tx.coinHistory.create({
        data: {
          viewerId,
          amount: coinAmount,
          reason: jackpotWon ? 'JACKPOT' : 'SPIN_PRIZE',
          details: jackpotWon ? `Jackpot: ${coinAmount} coins` : `Roulette prize: ${coinAmount} coins`,
        },
      });
    }

    if (jackpotWon) {
      await tx.systemState.update({ where: { id: STATE_ID }, data: { jackpotTotal: JACKPOT_SEED } });
    }

    return { coinAmount, jackpotWon, jackpotTotalAfter: jackpotWon ? JACKPOT_SEED : bankAfterShare };
  });

  return {
    userId: twitchId,
    username,
    prizeType: prize.prizeType,
    xpAmount: prize.xpAmount,
    ...outcome,
  };
};
