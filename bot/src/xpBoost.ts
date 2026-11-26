// Буст XP стрима, как в старом fox-sphere (modules/stream/stream.service.ts): множитель и момент
// окончания лежат в SystemState, поэтому буст переживает рестарт бота и перезагрузку сцены OBS.
// Включают его `!xpboost` и level-up стрима (если буста ещё нет); множитель получают и зритель,
// и стрим, но только за XP сообщения.
import { BOOST_CONFIG } from '../../shared/economy';
import type { XpBoostPayload } from '../../shared/events';
import { prisma } from './db';
import { emitEvent } from './socket';

const STATE_ID = 1;
// Как в старом боте: XP считается на каждое сообщение, а читать базу каждый раз незачем
const CACHE_MS = 1000;
let cache: { boost: XpBoostPayload | null; at: number } | null = null;

// Просроченный буст — это отсутствие буста: строка сама себя не чистит
const resolveBoost = (
  row: { xpBoostMultiplier: number; xpBoostExpiresAt: Date | null } | null,
  now: number,
): XpBoostPayload | null => {
  if (!row?.xpBoostExpiresAt || row.xpBoostExpiresAt.getTime() <= now) return null;
  return { multiplier: row.xpBoostMultiplier, expiresAt: row.xpBoostExpiresAt.getTime() };
};

export const getActiveXpBoost = async (): Promise<XpBoostPayload | null> => {
  const now = Date.now();
  if (cache && now - cache.at < CACHE_MS) return cache.boost;
  const row = await prisma.systemState.findUnique({ where: { id: STATE_ID } });
  const boost = resolveBoost(row, now);
  cache = { boost, at: now };
  return boost;
};

// Включает буст и сообщает оверлею после записи: оверлей, открытый посреди стрима, и оверлей,
// открытый до команды, видят один и тот же момент окончания.
export const activateXpBoost = async (minutes: number): Promise<XpBoostPayload> => {
  const expiresAt = new Date(Date.now() + Math.round(minutes * 60_000));
  await prisma.systemState.upsert({
    where: { id: STATE_ID },
    create: { id: STATE_ID, xpBoostMultiplier: BOOST_CONFIG.MULTIPLIER, xpBoostExpiresAt: expiresAt },
    update: { xpBoostMultiplier: BOOST_CONFIG.MULTIPLIER, xpBoostExpiresAt: expiresAt },
  });
  const boost = { multiplier: BOOST_CONFIG.MULTIPLIER, expiresAt: expiresAt.getTime() };
  cache = { boost, at: Date.now() };
  emitEvent('stream:xp-boost', boost);
  return boost;
};

export const cancelXpBoost = async (): Promise<void> => {
  await prisma.systemState.upsert({
    where: { id: STATE_ID },
    create: { id: STATE_ID },
    update: { xpBoostMultiplier: 1, xpBoostExpiresAt: null },
  });
  cache = { boost: null, at: Date.now() };
  emitEvent('stream:xp-boost', null);
};

// Level-up стрима: если буст уже идёт, он не продлевается и не заменяется
export const startAutoXpBoost = async (): Promise<boolean> => {
  if (await getActiveXpBoost()) return false;
  await activateXpBoost(BOOST_CONFIG.AUTO_MINUTES);
  return true;
};
