import Phaser from 'phaser';
import { ARENA_HEIGHT, ARENA_WIDTH, TowerScene } from './TowerScene';

// Отдельная маленькая игра под арену башни: прозрачный холст фиксированного размера, ввода и звука нет.
// Она не зависит от полосы героев, поэтому башню можно включить и без неё.
export const createTowerGame = (parent: HTMLElement): Promise<{ game: Phaser.Game; scene: TowerScene }> =>
  new Promise((resolve) => {
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent,
      transparent: true,
      banner: false,
      audio: { noAudio: true },
      disableContextMenu: true,
      input: { mouse: false, touch: false, keyboard: false, gamepad: false },
      scale: { mode: Phaser.Scale.NONE, width: ARENA_WIDTH, height: ARENA_HEIGHT },
      // `game` присваивается после конструктора, а сцена может создаться раньше: ждём микрозадачу
      scene: [new TowerScene((scene) => queueMicrotask(() => resolve({ game, scene })))],
    });
  });
