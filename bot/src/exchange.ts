// Обмен баллов канала на монеты, как UserService.exchangeChannelPoints в старом fox-sphere.
// Монеты и запись в CoinHistory идут одной транзакцией; redemptionId уникален, поэтому повтор одной активации ничего не платит.
import { COIN_EXCHANGE_PACKAGES, type CoinExchangeKind } from '../../shared/economy';
import type { Viewer } from '../../generated/prisma/client';
import { prisma } from './db';

export type CoinExchangeResult = { status: 'ok'; coins: number } | { status: 'duplicate' };

const isUniqueViolation = (error: unknown): boolean =>
  error instanceof Error && 'code' in error && error.code === 'P2002';

export const exchangePointsForCoins = async (
  viewer: Viewer,
  kind: CoinExchangeKind,
  redemptionId: string,
): Promise<CoinExchangeResult> => {
  const pkg = COIN_EXCHANGE_PACKAGES[kind];
  const existing = await prisma.coinHistory.findUnique({ where: { redemptionId }, select: { id: true } });
  if (existing) return { status: 'duplicate' };

  try {
    await prisma.$transaction([
      prisma.viewer.update({ where: { id: viewer.id }, data: { coins: { increment: pkg.coins } } }),
      prisma.coinHistory.create({
        data: {
          viewerId: viewer.id,
          amount: pkg.coins,
          reason: 'CHANGE_POINTS',
          details: `${pkg.title}: ${pkg.points} channel points -> ${pkg.coins} coins`,
          redemptionId,
        },
      }),
    ]);
  } catch (error) {
    // Та же активация пришла дважды одновременно
    if (isUniqueViolation(error)) return { status: 'duplicate' };
    throw error;
  }
  return { status: 'ok', coins: pkg.coins };
};
