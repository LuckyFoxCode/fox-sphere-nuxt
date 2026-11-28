// !tower (алиас !башня): герой зрителя идёт на следующий этаж башни. Бой показывает оверлей, на экране
// он один за раз, остальные встают в очередь; итог бот пишет в чат, когда бой доигран.
import { codeCommand } from '../../../shared/commands';
import { getEnemy, TOWER_CONFIG } from '../../../shared/tower';
import { getHeroById } from '../../../shared/heroes';
import { messages } from '../language';
import { enqueueTower, hasTowerAttempts, isQueued, type TowerOutcome } from '../tower';
import type { CommandRegistry } from './registry';

const TOWER_COOLDOWN_MS = 5000;

export const registerTowerCommand = (registry: CommandRegistry): void => {
  registry.register({
    ...codeCommand('tower'),
    cooldownMs: TOWER_COOLDOWN_MS,
    run: async ({ viewer, displayName, reply, releaseCooldown }) => {
      const t = messages().tower;

      if (isQueued(viewer.twitchId)) {
        releaseCooldown();
        await reply(t.alreadyQueued(displayName));
        return;
      }
      if (!(await hasTowerAttempts(viewer.id))) {
        releaseCooldown();
        await reply(t.noAttempts(displayName, TOWER_CONFIG.ATTEMPTS_PER_DAY));
        return;
      }

      const announce = async (outcome: TowerOutcome): Promise<void> => {
        if (outcome.status === 'no-attempts') return reply(t.noAttempts(displayName, TOWER_CONFIG.ATTEMPTS_PER_DAY));
        if (outcome.status === 'complete') return reply(t.complete(displayName));
        const hero = getHeroById(outcome.heroId).name;
        const enemy = getEnemy(outcome.floor).name;
        await reply(
          outcome.fight.won
            ? t.won(displayName, hero, outcome.floor, enemy, outcome.coins, outcome.xp, outcome.levelUp, outcome.left)
            : t.lost(displayName, hero, outcome.floor, enemy, outcome.xp, outcome.levelUp, outcome.left),
        );
      };

      const position = enqueueTower({ viewerId: viewer.id, twitchId: viewer.twitchId, displayName, announce });
      // Первому в очереди писать не нужно: его бой начнётся сразу и итог придёт после него
      if (position > 1) await reply(t.queued(displayName, position));
    },
  });
};
