// Выплата улова, как grantCatch в старом fox-sphere (modules/fishing/fishing.service.ts).
import type { FishCatch } from '../../shared/fishing';
import { addToBank } from './bank';
import { prisma } from './db';

// Показ начисленного XP (шапка стрима, сообщения о новых уровнях)
export type ShowXp = () => Promise<void>;

// `awardXp` начисляет XP зрителю и стриму общим кодом бота. Возвращает показ XP, если он был.
export const grantCatch = async (
  viewerId: number,
  caught: FishCatch,
  awardXp: (xp: number) => Promise<ShowXp>,
): Promise<ShowXp | null> => {
  switch (caught.catchType) {
    case 'coins': {
      const amount = caught.coinAmount;
      await prisma.$transaction([
        prisma.viewer.update({ where: { id: viewerId }, data: { coins: { increment: amount } } }),
        prisma.coinHistory.create({
          data: { viewerId, amount, reason: 'FISH', details: `Fishing catch: ${amount} coins` },
        }),
      ]);
      return null;
    }
    case 'xp': {
      const amount = caught.xpAmount;
      const showXp = await awardXp(amount);
      // XP уже начислен: сбой записи в историю не должен прятать улов
      await prisma.xpHistory
        .create({ data: { viewerId, amount, reason: 'FISH', details: `Fishing catch: ${amount} XP` } })
        .catch((error: unknown) => console.error(`[fish] XP +${amount} не записан в историю:`, error));
      return showXp;
    }
    // Сундук: монеты идут только в банк рулетки, зрителю и в историю ничего не пишется
    case 'bank':
      await addToBank(caught.bankAmount);
      return null;
    case 'empty':
      return null;
  }
};
