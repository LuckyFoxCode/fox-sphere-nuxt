import type Phaser from 'phaser';
import {
  WANDER_IDLE_PAUSE,
  WANDER_INITIAL_DELAY,
  WANDER_STEP_PAUSE,
  calculateAnimTimeScale,
  getRandomInt,
  nextWanderStep,
} from '~/utils/wander';

// Спрайт стоит чуть ниже нижнего края: прозрачные пиксели под ногами в кадре не нужны
export const HERO_Y_OFFSET = 22;

export type WanderOptions = {
  xPercent: number;
  idleKey: string;
  walkKey: string;
  // Масштабирует длительность шага: быстрый герой проходит тот же шаг быстрее
  speed: number;
};

const toPixels = (width: number, xPercent: number) => (width * xPercent) / 100;

// Водит один спрайт по нижней полосе шагами на твинах. Позиция по X хранится в процентах ширины
// холста и переводится в пиксели только в начале шага, поэтому ресайз её не ломает.
export class WanderController {
  private xPercent: number;
  private direction: 1 | -1;
  private timer: Phaser.Time.TimerEvent | null = null;
  private tween: Phaser.Tweens.Tween | null = null;
  private stopped = false;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly sprite: Phaser.GameObjects.Sprite,
    private readonly options: WanderOptions,
  ) {
    this.xPercent = options.xPercent;
    this.direction = Math.random() > 0.5 ? 1 : -1;
  }

  start(): void {
    this.stopped = false;
    this.placeAtStart();
    this.sprite.setFlipX(this.direction === 1);
    this.playIdle();
    this.schedule(getRandomInt(WANDER_INITIAL_DELAY.min, WANDER_INITIAL_DELAY.max));
  }

  // После ресайза холста. `xPercent` в середине шага уже указывает на его цель, и взять её значит
  // телепортировать героя вперёд, поэтому сначала берётся текущая позиция спрайта.
  reposition(): void {
    this.timer?.remove();
    this.tween?.remove();
    this.timer = null;
    this.tween = null;

    const width = this.scene.scale.width;
    if (width > 0) this.xPercent = (this.sprite.x / width) * 100;

    this.start();
  }

  stop(): void {
    this.stopped = true;
    this.timer?.remove();
    this.tween?.remove();
    this.timer = null;
    this.tween = null;
  }

  private placeAtStart(): void {
    this.sprite.setPosition(
      toPixels(this.scene.scale.width, this.xPercent),
      this.scene.scale.height + HERO_Y_OFFSET,
    );
  }

  private schedule(delay: number): void {
    this.timer = this.scene.time.delayedCall(delay, () => this.decide());
  }

  private decide(): void {
    this.timer = null;
    if (this.stopped) return;

    const step = nextWanderStep(this.xPercent, this.direction, this.options.speed);

    if (!step) {
      this.playIdle();
      this.schedule(getRandomInt(WANDER_IDLE_PAUSE.min, WANDER_IDLE_PAUSE.max));
      return;
    }

    this.xPercent = step.newX;
    this.direction = step.newDirection;
    this.sprite.setFlipX(step.newDirection === 1);

    this.tween = this.scene.tweens.add({
      targets: this.sprite,
      x: toPixels(this.scene.scale.width, step.newX),
      duration: step.moveDuration * 1000,
      ease: 'Linear',
      onComplete: () => {
        this.tween = null;
        if (this.stopped) return;

        this.playIdle();
        this.schedule(getRandomInt(WANDER_STEP_PAUSE.min, WANDER_STEP_PAUSE.max));
      },
    });

    // Скорость анимации ходьбы под скорость шага, чтобы ноги не скользили. Именно `anims.timeScale`:
    // у твина он растянул бы и сам шаг.
    this.sprite.anims.timeScale = calculateAnimTimeScale(step);
    this.sprite.play(this.options.walkKey, true);
  }

  private playIdle(): void {
    this.sprite.anims.timeScale = 1;
    this.sprite.play(this.options.idleKey, true);
  }
}
