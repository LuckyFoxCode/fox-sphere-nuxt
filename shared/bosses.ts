// Боссы башни. Новый босс: пять листов в public/assets/bosses/<id>/ (idle, walking, running,
// attacking, hurt, dying - все .webp), запись здесь и строка в BOSS_FLOORS (shared/tower.ts).
export type BossDefinition = {
  id: string;
  name: string;
  // Клетка листа 840x720: крупнее героя, это и делает босса «большим» на арене
  frameWidth: number;
  frameHeight: number;
};

const BOSS_FRAME = { frameWidth: 840, frameHeight: 720 } as const;

export const BOSSES: readonly BossDefinition[] = [
  { id: 'pirate_zombie', name: 'Pirate Zombie', ...BOSS_FRAME },
  { id: 'squidman', name: 'Squidman', ...BOSS_FRAME },
  { id: 'pirate_leader', name: 'Pirate Leader', ...BOSS_FRAME },
  { id: 'aztec_leader', name: 'Aztec Leader', ...BOSS_FRAME },
  { id: 'maya_leader', name: 'Maya Leader', ...BOSS_FRAME },
  { id: 'nordic_leader', name: 'Nordic Leader', ...BOSS_FRAME },
  { id: 'boar_king', name: 'Boar King', ...BOSS_FRAME },
  { id: 'shaman_king', name: 'Shaman King', ...BOSS_FRAME },
  { id: 'devil_leader', name: 'Devil Leader', ...BOSS_FRAME },
];

const bossesById = new Map<string, BossDefinition>(BOSSES.map((boss) => [boss.id, boss]));

export const getBossById = (id: string): BossDefinition | undefined => bossesById.get(id);
