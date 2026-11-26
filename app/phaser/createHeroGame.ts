import Phaser from 'phaser';
import { HeroScene } from './HeroScene';

// Прозрачный холст на весь родитель. Для OBS нужны оба условия: `transparent: true` у Phaser и
// прозрачный фон страницы (`useTransparentPage`). Ввода и звука у героев нет.
export const createHeroGame = (parent: HTMLElement): Phaser.Game =>
  new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    transparent: true,
    banner: false,
    audio: { noAudio: true },
    disableContextMenu: true,
    input: { mouse: false, touch: false, keyboard: false, gamepad: false },
    scale: { mode: Phaser.Scale.RESIZE, width: '100%', height: '100%' },
    scene: [HeroScene],
  });
