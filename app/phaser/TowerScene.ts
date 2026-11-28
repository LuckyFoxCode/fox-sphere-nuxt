import Phaser from 'phaser';
import { animDurationMs, combatSheet, COMBAT_ANIMS, type CombatAnim } from '#shared/combat';
import type { TowerFightPayload } from '#shared/events';
import { getHeroById } from '#shared/heroes';
import { getBossById } from '#shared/bosses';
import { fightDurationMs, INTRO_MS, TOWER_CONFIG, TURN_MS } from '#shared/tower';

export const ARENA_WIDTH = 640;
export const ARENA_HEIGHT = 230;
const GROUND_Y = ARENA_HEIGHT - 6;
const HERO_X = 150;
const ENEMY_X = ARENA_WIDTH - 150;
// Босс нарисован крупнее героя: масштаб меньше, чтобы голова не упиралась в полоску здоровья
const SCALE = { heroes: 0.5, bosses: 0.42 } as const;
// Отступ от стоп до низа клетки листа (в пикселях листа), измерен по альфа-каналу
const FOOT_PAD = { heroes: 88, bosses: 142 } as const;
const LUNGE_PX = 50;
// Удар «попадает» примерно на середине анимации атаки
const HIT_AT_MS = 165;

export type TowerHooks = {
  // После каждого удара: обе стороны уже в новом состоянии здоровья
  onTurn: (turn: TowerFightPayload['turns'][number]) => void;
  // Падение проигравшего началось: пора показать итог
  onResult: (won: boolean) => void;
  onEnd: () => void;
};

type Side = {
  sprite: Phaser.GameObjects.Sprite;
  folder: 'heroes' | 'bosses';
  id: string;
  baseX: number;
};

const textureKey = (folder: string, id: string, anim: CombatAnim): string => `${folder}:${id}:${anim}`;

export class TowerScene extends Phaser.Scene {
  private sides: Side[] = [];
  private timers: Phaser.Time.TimerEvent[] = [];

  constructor(private readonly onReady: (scene: TowerScene) => void) {
    super({ key: 'TowerScene' });
  }

  create(): void {
    this.onReady(this);
  }

  // Листы грузятся при первом бою и остаются в кэше: в OBS они одни и те же, по сети идут один раз
  private ensure(folder: 'heroes' | 'bosses', id: string, frameWidth: number, frameHeight: number): Promise<void> {
    let queued = false;
    for (const anim of COMBAT_ANIMS) {
      const key = textureKey(folder, id, anim);
      if (this.textures.exists(key)) continue;
      this.load.spritesheet(key, `/${combatSheet(folder, id, anim).path}`, { frameWidth, frameHeight });
      queued = true;
    }
    const finish = () => {
      for (const anim of COMBAT_ANIMS) {
        const key = textureKey(folder, id, anim);
        if (this.anims.exists(key)) continue;
        const sheet = combatSheet(folder, id, anim);
        this.anims.create({
          key,
          frames: this.anims.generateFrameNumbers(key, { start: 0, end: sheet.frames - 1 }),
          frameRate: sheet.frameRate,
          repeat: sheet.repeat ? -1 : 0,
        });
      }
    };
    if (!queued) {
      finish();
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      this.load.once(Phaser.Loader.Events.COMPLETE, () => {
        finish();
        resolve();
      });
      this.load.start();
    });
  }

  private makeSide(folder: 'heroes' | 'bosses', id: string, x: number, facing: 'left' | 'right', tint: number | null): Side {
    const sprite = this.add.sprite(x, GROUND_Y + FOOT_PAD[folder] * SCALE[folder], textureKey(folder, id, 'idle')).setOrigin(0.5, 1);
    sprite.setScale(SCALE[folder]);
    // Все листы нарисованы лицом влево: справа соперник смотрит как есть, герой слева отражается
    sprite.setFlipX(facing === 'right');
    if (tint !== null) sprite.setTint(tint);
    sprite.play(textureKey(folder, id, 'idle'));
    return { sprite, folder, id, baseX: x };
  }

  private anim(side: Side, anim: CombatAnim, then?: CombatAnim): void {
    side.sprite.play(textureKey(side.folder, side.id, anim));
    if (then) side.sprite.chain(textureKey(side.folder, side.id, then));
  }

  private later(ms: number, fn: () => void): void {
    this.timers.push(this.time.delayedCall(ms, fn));
  }

  clear(): void {
    for (const timer of this.timers) timer.remove();
    this.timers = [];
    this.tweens.killAll();
    for (const side of this.sides) side.sprite.destroy();
    this.sides = [];
  }

  async play(fight: TowerFightPayload, hooks: TowerHooks): Promise<void> {
    this.clear();
    const hero = getHeroById(fight.heroId);
    const enemyFolder = fight.enemy.kind === 'boss' ? 'bosses' : 'heroes';
    const enemyDef = enemyFolder === 'bosses' ? getBossById(fight.enemy.spriteId) : getHeroById(fight.enemy.spriteId);
    if (!enemyDef) {
      hooks.onEnd();
      return;
    }

    await this.ensure('heroes', hero.id, hero.frameWidth, hero.frameHeight);
    await this.ensure(enemyFolder, enemyDef.id, enemyDef.frameWidth, enemyDef.frameHeight);
    // Пока грузились листы, мог прийти другой бой: тогда этот уже не нужен
    this.clear();

    const heroSide = this.makeSide('heroes', hero.id, HERO_X, 'right', null);
    const enemySide = this.makeSide(enemyFolder, enemyDef.id, ENEMY_X, 'left', fight.enemy.tint);
    this.sides = [heroSide, enemySide];

    const lastIndex = fight.turns.length - 1;
    fight.turns.forEach((turn, index) => {
      const attacker = turn.by === 'hero' ? heroSide : enemySide;
      const defender = turn.by === 'hero' ? enemySide : heroSide;
      const dir = turn.by === 'hero' ? 1 : -1;
      const start = INTRO_MS + index * TURN_MS;
      const lethal = index === lastIndex;

      this.later(start, () => {
        this.anim(attacker, 'attacking', 'idle');
        this.tweens.add({
          targets: attacker.sprite,
          x: attacker.baseX + dir * LUNGE_PX,
          duration: animDurationMs('attacking') / 2,
          yoyo: true,
          ease: 'Sine.easeOut',
        });
      });

      this.later(start + HIT_AT_MS, () => {
        hooks.onTurn(turn);
        if (lethal) {
          this.anim(defender, 'dying');
          hooks.onResult(fight.won);
        } else {
          this.anim(defender, 'hurt', 'idle');
          this.tweens.add({
            targets: defender.sprite,
            x: defender.baseX + dir * 10,
            duration: 40,
            yoyo: true,
            repeat: 1,
          });
        }
      });
    });

    this.later(fightDurationMs(fight.turns.length) - 400, () => {
      this.tweens.add({ targets: [heroSide.sprite, enemySide.sprite], alpha: 0, duration: 380 });
    });
    this.later(fightDurationMs(fight.turns.length), () => hooks.onEnd());
  }
}

// Пауза после последнего удара показана на экране итогом: константа общая с ботом
export const ARENA_END_PAUSE_MS = TOWER_CONFIG.END_PAUSE_MS;
