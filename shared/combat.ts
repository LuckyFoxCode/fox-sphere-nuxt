// Бой на оверлее (башня): анимации, которые есть и у героев, и у боссов. Сетки листов одинаковы,
// различается только размер клетки: у героев 480x480, у боссов 840x720 (см. shared/bosses.ts).
import type { HeroSpriteSheet } from './heroes';

export const COMBAT_ANIMS = ['idle', 'walking', 'running', 'attacking', 'hurt', 'dying'] as const;
export type CombatAnim = (typeof COMBAT_ANIMS)[number];

// Кадры и сетка листа на анимацию; frameRate подобран на глаз под короткий удар
const SHEET_LAYOUT: Record<CombatAnim, Omit<HeroSpriteSheet, 'path'> & { repeat: boolean }> = {
  idle: { frames: 16, frameRate: 12, columns: 4, rows: 4, repeat: true },
  walking: { frames: 20, frameRate: 16, columns: 4, rows: 5, repeat: true },
  running: { frames: 12, frameRate: 16, columns: 4, rows: 3, repeat: true },
  attacking: { frames: 10, frameRate: 14, columns: 5, rows: 2, repeat: false },
  hurt: { frames: 10, frameRate: 14, columns: 5, rows: 2, repeat: false },
  dying: { frames: 10, frameRate: 10, columns: 5, rows: 2, repeat: false },
};

export type CombatSheet = HeroSpriteSheet & { repeat: boolean };

// Путь без ведущего слеша, как у остальных листов: `assets/<heroes|bosses>/<id>/<anim>.webp`
export const combatSheet = (folder: 'heroes' | 'bosses', id: string, anim: CombatAnim): CombatSheet => ({
  path: `assets/${folder}/${id}/${anim}.webp`,
  ...SHEET_LAYOUT[anim],
});

// Сколько длится анимация, мс
export const animDurationMs = (anim: CombatAnim): number => {
  const { frames, frameRate } = SHEET_LAYOUT[anim];
  return Math.round((frames / frameRate) * 1000);
};
