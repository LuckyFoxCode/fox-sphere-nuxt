import { getLevelRange } from '#shared/xp';

export const XP_CELLS = 40;

// Доля пройденного уровня (0..1) и «new / max» для подписи. Внутри уровня: от порога прошлого до порога текущего.
export const xpProgress = (totalXp: number, lvl: number) => {
  const { startXp, maxXp } = getLevelRange(lvl);
  const span = Math.max(1, maxXp - startXp);
  const current = Math.min(span, Math.max(0, totalXp - startXp));
  return { current, span, ratio: current / span };
};

export const filledCells = (ratio: number): number => Math.round(ratio * XP_CELLS);
