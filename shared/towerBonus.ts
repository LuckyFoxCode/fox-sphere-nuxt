// Бонус башни: меняется раз в 3 дня по календарю, для всех одинаково, без базы. Считается по местной
// дате машины (как и попытки), поэтому бот и оверлей на одной машине видят один и тот же бонус.
export type StatMultipliers = { health?: number; attack?: number; defense?: number; speed?: number };

export type TowerBonus = {
  // Он же имя иконки в оверлее
  id: 'fury' | 'armor' | 'vigor' | 'weak-foes' | 'brittle-foes' | 'hunt';
  title: string;
  description: string;
  hero: StatMultipliers;
  enemy: StatMultipliers;
};

export const BONUS_PERIOD_DAYS = 3;

export const TOWER_BONUSES: readonly TowerBonus[] = [
  { id: 'fury', title: 'Ярость', description: '+15% атаки героев', hero: { attack: 1.15 }, enemy: {} },
  { id: 'armor', title: 'Броня', description: '+15% защиты героев', hero: { defense: 1.15 }, enemy: {} },
  { id: 'vigor', title: 'Бодрость', description: '+20% здоровья героев', hero: { health: 1.2 }, enemy: {} },
  { id: 'weak-foes', title: 'Слабые враги', description: '−10% здоровья врагов', hero: {}, enemy: { health: 0.9 } },
  { id: 'brittle-foes', title: 'Хрупкие враги', description: '−15% защиты врагов', hero: {}, enemy: { defense: 0.85 } },
  { id: 'hunt', title: 'Охота', description: '+10% скорости героев', hero: { speed: 1.1 }, enemy: {} },
];

export const getBonusById = (id: string): TowerBonus | undefined => TOWER_BONUSES.find((b) => b.id === id);

// Номер местных суток от эпохи: переход через полночь по местному времени, не по UTC
const localDayNumber = (date: Date): number =>
  Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000);

export const currentBonus = (date: Date = new Date()): TowerBonus => {
  const period = Math.floor(localDayNumber(date) / BONUS_PERIOD_DAYS);
  return TOWER_BONUSES[period % TOWER_BONUSES.length] as TowerBonus;
};

// Начало следующего периода (местная полночь), для строки «сменится через ...»
export const nextBonusChange = (date: Date = new Date()): Date => {
  const day = localDayNumber(date);
  const nextDay = (Math.floor(day / BONUS_PERIOD_DAYS) + 1) * BONUS_PERIOD_DAYS;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + (nextDay - day));
};
