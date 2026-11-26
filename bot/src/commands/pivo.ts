// !pivo: алиасы и кулдаун — из старого fox-sphere, тексты — shared/i18n. Обычное пиво — только
// фраза в чат; золото (5%) ещё пишет в счётчик зрителя и показывает алерт.
import { randomInt } from 'node:crypto';
import { PIVO_COOLDOWN_MS, PIVO_MESSAGE_VARIANTS, pickPivoOutcome } from '../../../shared/pivo';
import { grantGoldenBeer } from '../pivo';
import { messages } from '../language';
import { emitEvent } from '../socket';
import type { CommandRegistry } from './registry';

export type PivoDeps = {
  // Целое в [0, max): подменяется только в проверках, в бою — криптостойкий выбор
  random?: (maxExclusive: number) => number;
};

export const registerPivoCommand = (registry: CommandRegistry, deps: PivoDeps = {}): void => {
  const { random = randomInt } = deps;

  registry.register({
    name: 'pivo',
    aliases: ['пиво', 'beer'],
    cooldownMs: PIVO_COOLDOWN_MS,
    run: async ({ viewer, displayName, reply }) => {
      // Бросок первым, запись только при золоте: 95% вызовов не трогают базу
      if (pickPivoOutcome(random) === 'regular') {
        const variants = messages().pivo.regular;
        await reply(variants[random(PIVO_MESSAGE_VARIANTS) % variants.length]!(displayName));
        return;
      }

      const gold = await grantGoldenBeer(viewer.id);
      console.log(`[pivo] ${displayName}: золотое пиво #${gold.goldenBeers}, ступень ${gold.tier}`);
      await reply(messages().pivo.golden(displayName));
      // Эмит после сообщения: если чат не принял строку, оверлей не покажет дроп, которого никто не видел
      emitEvent('twitch:golden-beer', {
        userId: viewer.twitchId,
        username: displayName,
        ...gold,
      });
    },
  });
};
