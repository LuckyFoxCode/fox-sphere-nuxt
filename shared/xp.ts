import type { StreamStatePayload } from './events';

// Формула уровней перенесена из старого fox-sphere (packages/backend-shared/src/xp.ts).
// Накопительная схема: порог уровня lvl = step * (0 + 1 + ... + lvl).
// Зритель на уровне lvl переходит на lvl + 1, когда xp >= getXpThresholdForLevel(lvl).
export const getXpThresholdForLevel = (lvl: number, step: number = 100): number => {
  let totalXpNeeded = 0;
  for (let i = 0; i <= lvl; i++) {
    totalXpNeeded += i * step;
  }
  return totalXpNeeded;
};

// Начало и конец текущего уровня — для полосы XP
export const getLevelRange = (lvl: number, step?: number): { startXp: number; maxXp: number } => ({
  startXp: getXpThresholdForLevel(lvl - 1, step),
  maxXp: getXpThresholdForLevel(lvl, step),
});

// XP стрима: та же формула, но шаг 1000 (BASE_STREAM_STEP старого fox-sphere)
export const STREAM_XP_STEP = 1000;

// Уровень стрима после изменения XP. XP накопительный, за раз можно перескочить несколько уровней,
// вниз уровень не опускается.
export const getStreamLevel = (currentLvl: number, totalXp: number): number => {
  let lvl = currentLvl;
  while (totalXp >= getXpThresholdForLevel(lvl, STREAM_XP_STEP)) lvl++;
  return lvl;
};

// То, что получает шапка: уровень, весь накопленный XP и границы уровня
export const buildStreamState = (lvl: number, totalXp: number): StreamStatePayload => ({
  lvl,
  newXp: totalXp,
  ...getLevelRange(lvl, STREAM_XP_STEP),
});
