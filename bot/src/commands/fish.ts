// Рыбалка: !fish. Алиасы, кулдаун и тайминг поклёвки — из старого fox-sphere.
import { randomInt } from 'node:crypto';
import {
  FISH_BITE_DELAY_MAX_MS,
  FISH_BITE_DELAY_MIN_MS,
  FISH_CATCHES,
  FISH_COOLDOWN_MS,
  FISH_MESSAGE_VARIANTS,
  fishCatchMessage,
  pickCatch,
} from '../../../shared/fishing';
import { grantCatch } from '../fishing';
import { messages } from '../language';
import type { CommandRegistry } from './registry';
import type { SpinDeps } from './spin';
import type { CommandContext } from './types';

export type FishDeps = Pick<SpinDeps, 'awardPrizeXp'> & {
  // Целое в [0, max): подменяется только в проверках, в бою — криптостойкий выбор
  random?: (maxExclusive: number) => number;
};

export const registerFishCommand = (registry: CommandRegistry, deps: FishDeps): void => {
  const { awardPrizeXp, random = randomInt } = deps;
  // Незавершённые забросы по twitchId. Только в памяти: перезапуск бота их теряет, как в старом боте
  const pending = new Set<string>();

  // Поклёвка сама решает исход: «тянуть» зрителю не нужно
  const bite = async (ctx: CommandContext) => {
    const { viewer, displayName, reply } = ctx;
    const caught = FISH_CATCHES[pickCatch(random)];
    const showXp = await grantCatch(viewer.id, caught, (xp) => awardPrizeXp(ctx, xp));
    console.log(
      `[fish] ${displayName}: ${caught.catchType}, монет ${caught.coinAmount}, XP ${caught.xpAmount}, ` +
        `в банк ${caught.bankAmount}`,
    );
    // Как в старом боте: сообщение о новом уровне идёт раньше сообщения об улове
    await showXp?.().catch((error: unknown) => console.error(`[fish] XP ${displayName} не показан:`, error));
    await reply(fishCatchMessage(messages().fish, caught, displayName, random(FISH_MESSAGE_VARIANTS)));
  };

  registry.register({
    name: 'fish',
    aliases: ['рыбачить', 'рыбалка'],
    cooldownMs: FISH_COOLDOWN_MS,
    cooldownMessage: (name, seconds) => messages().fish.cooldown(name, seconds),
    run: async (ctx) => {
      const { viewer, displayName, reply, releaseCooldown } = ctx;
      const { twitchId } = viewer;
      if (pending.has(twitchId)) {
        releaseCooldown();
        await reply(messages().fish.already(displayName));
        return;
      }

      pending.add(twitchId);
      const delay = FISH_BITE_DELAY_MIN_MS + random(FISH_BITE_DELAY_MAX_MS - FISH_BITE_DELAY_MIN_MS + 1);
      // Поклёвку не ждём: XP за само сообщение не должен зависеть от рыбалки
      setTimeout(() => {
        void bite(ctx)
          .catch((error: unknown) => console.error(`[fish] улов ${displayName} не выдан:`, error))
          .finally(() => pending.delete(twitchId));
      }, delay).unref();

      await reply(messages().fish.cast(displayName));
    },
  });
};
