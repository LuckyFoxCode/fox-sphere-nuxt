// Лента вращения. Исход уже определён ботом: здесь только соседи вокруг выигрышной карточки.
// Как в старом оверлее, соседи берутся по тем же весам, что и призы, без двух одинаковых подряд.
import { pickSegment, type RouletteSegmentId } from '#shared/roulette';

export const TAPE_LENGTH = 40;
export const TAPE_WINNER_INDEX = 34;
// С какой карточки начинается показ: слева от неё должны быть соседи
export const TAPE_START_INDEX = 3;
export const TAPE_CARD_WIDTH = 164;
export const TAPE_GAP = 16;
export const TAPE_STRIDE = TAPE_CARD_WIDTH + TAPE_GAP;

const randomInt = (max: number) => Math.floor(Math.random() * max);

export const buildTape = (winner: RouletteSegmentId): RouletteSegmentId[] => {
  const tape: RouletteSegmentId[] = [];
  for (let index = 0; index < TAPE_LENGTH; index++) {
    if (index === TAPE_WINNER_INDEX) {
      tape.push(winner);
      continue;
    }
    let id = pickSegment(randomInt);
    // Соседи выигрышной карточки с ней совпадать могут: так выбирала и старая лента
    while (id === tape[index - 1] && index - 1 !== TAPE_WINNER_INDEX) id = pickSegment(randomInt);
    tape.push(id);
  }
  return tape;
};
