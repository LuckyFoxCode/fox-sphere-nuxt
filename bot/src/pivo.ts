// Золотое пиво из !pivo, как PivoService.roll в старом fox-sphere (modules/pivo/pivo.service.ts).
import { getGoldenBeerTier } from '../../shared/pivo';
import { prisma } from './db';

export type GoldenBeerResult = { goldenBeers: number; tier: number; isNewTier: boolean };

// `increment` возвращает новое значение одним атомарным UPDATE, поэтому два золота подряд
// не могут прочитать одно и то же число и оба объявить себя новой ступенью.
export const grantGoldenBeer = async (viewerId: number): Promise<GoldenBeerResult> => {
  const { goldenBeers } = await prisma.viewer.update({
    where: { id: viewerId },
    data: { goldenBeers: { increment: 1 } },
    select: { goldenBeers: true },
  });
  const tier = getGoldenBeerTier(goldenBeers);
  return { goldenBeers, tier, isNewTier: tier > getGoldenBeerTier(goldenBeers - 1) };
};
