import type Phaser from 'phaser';
import { getHeroById } from '#shared/heroes';
import { WanderController } from './WanderController';

const LABEL_GAP_PX = 8;
// Подпись не стоит записи стиля, пока герой сдвинулся меньше этого; стоящий герой не пишет ничего
const LABEL_MOVE_EPSILON_PX = 0.5;

export const heroIdleKey = (heroId: string): string => `${heroId}-idle`;
export const heroWalkKey = (heroId: string): string => `${heroId}-walk`;

// Один зритель на сцене: спрайт Phaser, контроллер, который его водит, и HTML-подпись над ним
export class HeroAgent {
  private readonly sprite: Phaser.GameObjects.Sprite;
  private readonly wander: WanderController;
  private readonly labelOffsetY: number;
  private label: HTMLElement | null = null;
  private lastLabelX = Number.NaN;

  constructor(scene: Phaser.Scene, heroId: string, xPercent: number) {
    const hero = getHeroById(heroId);

    this.sprite = scene.add.sprite(0, 0, heroIdleKey(hero.id)).setOrigin(0.5, 1);
    this.sprite.setScale(hero.scale);
    this.labelOffsetY = hero.frameHeight * hero.scale + LABEL_GAP_PX;

    this.wander = new WanderController(scene, this.sprite, {
      xPercent,
      idleKey: heroIdleKey(hero.id),
      walkKey: heroWalkKey(hero.id),
      speed: hero.baseStats.speed,
    });
    this.wander.start();
  }

  setLabel(label: HTMLElement): void {
    this.label = label;
    this.syncLabel(true);
  }

  // После ресайза холста: спрайт на место, подпись следом
  reposition(): void {
    this.wander.reposition();
    this.syncLabel(true);
  }

  syncLabel(force = false): void {
    const label = this.label;
    if (!label) return;

    const x = this.sprite.x;
    if (!force && Math.abs(x - this.lastLabelX) < LABEL_MOVE_EPSILON_PX) return;
    this.lastLabelX = x;

    const y = this.sprite.y - this.labelOffsetY;
    label.style.transform = `translate(-50%, -100%) translate(${x}px, ${y}px)`;
  }

  destroy(): void {
    this.wander.stop();
    this.sprite.destroy();
    this.label = null;
  }
}
