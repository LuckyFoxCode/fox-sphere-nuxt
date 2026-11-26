// !buy hero <имя> (алиас !купить), !use hero <имя> (алиасы !надеть, !активировать) и !shop (!магазин,
// !витрина). Каталог, цены и разбор аргументов — из старого fox-sphere. Отличия: витрина идёт текстом
// в чат (окна магазина на оверлее пока нет), а смену героя оверлей узнаёт из `hero:changed`.
import { findHeroByTerm, HEROES } from '../../../shared/heroes';
import { buyHero, equipHero } from '../heroes';
import { messages } from '../language';
import { emitEvent } from '../socket';
import type { CommandRegistry } from './registry';

const BUY_COOLDOWN_MS = 5000;
const USE_COOLDOWN_MS = 5000;
const SHOP_COOLDOWN_MS = 30_000;

// Категории, которые называют героя; `!buy hero tug` и `!buy герой tug`. Единственная пока категория
const HERO_CATEGORIES: ReadonlySet<string> = new Set(['hero', 'герой']);

// «hero big robber» → категория «hero», название «big robber»; null — аргументов не хватает
const parseItemArgs = (args: readonly string[]): { category: string; term: string } | null => {
  const [category, ...rest] = args.map((arg) => arg.trim()).filter((arg) => arg.length > 0);
  if (!category || rest.length === 0) return null;
  return { category: category.toLowerCase(), term: rest.join(' ').toLowerCase() };
};

const heroNames = (): string => HEROES.map((hero) => hero.name).join(', ');

export const registerHeroCommands = (registry: CommandRegistry, prefix: string): void => {
  registry.register({
    name: 'buy',
    aliases: ['купить'],
    cooldownMs: BUY_COOLDOWN_MS,
    run: async ({ viewer, displayName, args, reply, releaseCooldown }) => {
      const t = messages().hero;
      const parsed = parseItemArgs(args);
      if (!parsed || !HERO_CATEGORIES.has(parsed.category)) {
        releaseCooldown();
        await reply(t.buyUsage(displayName, prefix));
        return;
      }

      // `findHeroByTerm`, не `getHeroById`: тот на опечатку отдал бы героя по умолчанию
      const hero = findHeroByTerm(parsed.term);
      if (!hero) {
        releaseCooldown();
        await reply(t.unknown(displayName, heroNames()));
        return;
      }

      const result = await buyHero(viewer.id, hero);
      if (result.status === 'already-owned') {
        releaseCooldown();
        await reply(t.alreadyOwned(displayName, hero.name));
      } else if (result.status === 'insufficient-funds') {
        releaseCooldown();
        await reply(t.notEnough(displayName, hero.name, hero.price, result.coins, result.shortfall));
      } else {
        console.log(`[hero] ${displayName}: купил ${hero.id} за ${hero.price}`);
        await reply(t.bought(displayName, hero.name, hero.price, result.coinsAfter, prefix));
      }
    },
  });

  registry.register({
    name: 'use',
    aliases: ['надеть', 'активировать'],
    cooldownMs: USE_COOLDOWN_MS,
    run: async ({ viewer, displayName, args, reply, releaseCooldown }) => {
      const t = messages().hero;
      const parsed = parseItemArgs(args);
      if (!parsed || !HERO_CATEGORIES.has(parsed.category)) {
        releaseCooldown();
        await reply(t.useUsage(displayName, prefix));
        return;
      }

      const hero = findHeroByTerm(parsed.term);
      if (!hero) {
        releaseCooldown();
        await reply(t.unknown(displayName, heroNames()));
        return;
      }

      const result = await equipHero(viewer.id, hero.id);
      if (result === 'not-owned') {
        releaseCooldown();
        await reply(t.notOwned(displayName, hero.name, prefix));
      } else if (result === 'already-active') {
        releaseCooldown();
        await reply(t.alreadyActive(displayName, hero.name));
      } else {
        console.log(`[hero] ${displayName}: надел ${hero.id}`);
        // До ответа в чат: спрайт меняется сразу, а следующее сообщение уже придёт с новым героем
        emitEvent('hero:changed', { userId: viewer.twitchId, heroId: hero.id });
        await reply(t.equipped(displayName, hero.name));
      }
    },
  });

  registry.register({
    name: 'shop',
    aliases: ['магазин', 'витрина'],
    cooldownMs: SHOP_COOLDOWN_MS,
    // Витрина одна на всех: повтор в течение 30 секунд молча пропускается
    cooldownScope: 'global',
    run: async ({ displayName, reply }) => {
      await reply(
        messages().hero.shop(
          displayName,
          HEROES.map(({ name, price }) => ({ name, price })),
          prefix,
        ),
      );
    },
  });
};
