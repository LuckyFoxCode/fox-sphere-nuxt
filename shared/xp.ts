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

// Начало и конец текущего уровня — для полосы XP в профиле
export const getLevelRange = (lvl: number): { startXp: number; maxXp: number } => ({
  startXp: getXpThresholdForLevel(lvl - 1),
  maxXp: getXpThresholdForLevel(lvl),
});
