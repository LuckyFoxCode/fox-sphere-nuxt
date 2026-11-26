// Герои зрителей: активный герой для оверлея, покупка и смена. Логика из HeroService старого fox-sphere,
// но без каналов и без общего кэша с UserService: один канал, один процесс.
import { DEFAULT_HERO_ID, type HeroDefinition } from '../../shared/heroes';
import { prisma } from './db';

// viewerId -> активный heroId. Каждое сообщение зрителя спрашивает героя, а базу трогаем только
// на первом; смена (`!use`) обновляет запись сама, поэтому устаревшей она не бывает.
const activeCache = new Map<number, string>();

// Активный герой зрителя. Новичок (или зритель без активного) получает бесплатного героя:
// запись создаётся сразу, чтобы `!use` и покупки видели его в коллекции.
export const getActiveHeroId = async (viewerId: number): Promise<string> => {
  const cached = activeCache.get(viewerId);
  if (cached) return cached;

  const active = await prisma.viewerHero.findFirst({ where: { viewerId, isActive: true } });
  if (active) {
    activeCache.set(viewerId, active.heroId);
    return active.heroId;
  }

  await prisma.viewerHero.upsert({
    where: { viewerId_heroId: { viewerId, heroId: DEFAULT_HERO_ID } },
    create: { viewerId, heroId: DEFAULT_HERO_ID, isActive: true },
    update: { isActive: true },
  });
  activeCache.set(viewerId, DEFAULT_HERO_ID);
  return DEFAULT_HERO_ID;
};

export type BuyHeroResult =
  | { status: 'already-owned' }
  | { status: 'insufficient-funds'; coins: number; shortfall: number }
  | { status: 'bought'; coinsAfter: number };

// Покупка одной транзакцией: списание с условием «хватает монет» (баланс мог измениться между
// сообщением и записью), герой в коллекцию и строка в журнале монет.
export const buyHero = (viewerId: number, hero: HeroDefinition): Promise<BuyHeroResult> =>
  prisma.$transaction(async (tx): Promise<BuyHeroResult> => {
    const owned = await tx.viewerHero.findUnique({
      where: { viewerId_heroId: { viewerId, heroId: hero.id } },
    });
    if (owned) return { status: 'already-owned' };

    if (hero.price > 0) {
      const debited = await tx.viewer.updateMany({
        where: { id: viewerId, coins: { gte: hero.price } },
        data: { coins: { decrement: hero.price } },
      });
      if (debited.count === 0) {
        const viewer = await tx.viewer.findUniqueOrThrow({ where: { id: viewerId } });
        return {
          status: 'insufficient-funds',
          coins: viewer.coins,
          shortfall: hero.price - viewer.coins,
        };
      }
      await tx.coinHistory.create({
        data: { viewerId, amount: -hero.price, reason: 'HERO_PURCHASE', details: `Hero: ${hero.id}` },
      });
    }

    await tx.viewerHero.create({ data: { viewerId, heroId: hero.id } });
    const viewer = await tx.viewer.findUniqueOrThrow({ where: { id: viewerId } });
    return { status: 'bought', coinsAfter: viewer.coins };
  });

export type EquipHeroResult = 'equipped' | 'not-owned' | 'already-active';

// Надеть героя: он должен быть куплен. Активный ровно один, поэтому снимаем флаг с остальных
export const equipHero = async (viewerId: number, heroId: string): Promise<EquipHeroResult> => {
  const result = await prisma.$transaction(async (tx): Promise<EquipHeroResult> => {
    const owned = await tx.viewerHero.findUnique({ where: { viewerId_heroId: { viewerId, heroId } } });
    if (!owned) return 'not-owned';
    if (owned.isActive) return 'already-active';

    await tx.viewerHero.updateMany({ where: { viewerId, isActive: true }, data: { isActive: false } });
    await tx.viewerHero.update({ where: { id: owned.id }, data: { isActive: true } });
    return 'equipped';
  });
  if (result === 'equipped') activeCache.set(viewerId, heroId);
  return result;
};
