// Украинский. Фразы построены без рода зрителя (настоящее время вместо «закинув/закинула»).
import { counter } from './plural';
import type { BotMessages } from './types';

const count = counter('uk');
const coinsText = (coins: number) => count(coins, 'монета', 'монети', 'монет');

export const uk: BotMessages = {
  levelUp: (name, lvl) => `⚡ @${name} отримує новий рівень: ${lvl}! 🚀 GG!`,
  streamLevelUp: (lvl) => `⚡ НОВИЙ РІВЕНЬ СТРИМУ! Тепер у нас рівень ${lvl}! Пишіть у чат ще! 🚀`,
  follow: (name) => `🎉 Дякуємо за фолов, @${name}! Ласкаво просимо в родину Foxsphere! 🚀`,
  raid: (name, viewers) =>
    `⚡ @${name} залітає з рейдом: ${count(viewers, 'глядач', 'глядачі', 'глядачів')}! Ласкаво просимо у Sphere! 🦊🌐✨`,
  coins: (name, coins) => `💰 Гаманець • @${name} ➔ ${coinsText(coins)} 🪙`,
  profile: (name, { lvl, xp, xpToNext, coins, rank }) =>
    `@${name}: рівень ${lvl}, XP ${xp}/${xpToNext} до наступного, монет: ${coins}, місце в топі #${rank}`,
  spin: {
    cooldown: (name, seconds, prefix) => `⏳ @${name}, не так швидко! ${prefix}spin знову через ${seconds} с`,
    notEnough: (name, price, have) => `@${name}, бракує монет: потрібно ${price}, у тебе ${have}`,
    coins: (name, coins) => `💰 @${name} виловлює ${coinsText(coins)}!`,
    xp: (name, xp) => `⚡ @${name} отримує ${xp} XP!`,
    jackpotAnnounce: (name) => `👑 @${name} ЗРИВАЄ ДЖЕКПОТ!`,
    jackpotResult: (name, coins, bank) =>
      `🎰 @${name} забирає джекпот: ${coinsText(coins)}! Новий банк: ${bank}`,
    statsNone: (name, prefix) => `@${name}, у тебе ще немає спінів — тисни ${prefix}spin! 🎰`,
    stats: (name, spins, win, loss) => `🎰 @${name}: спінів ${spins}, виграно ${win}, програно ${loss}`,
  },
  fish: {
    cast: (name) => `@${name} закидає вудку…`,
    already: (name) => `@${name}, ти вже рибалиш`,
    cooldown: (name, seconds) => `⏳ @${name}, вудка ще не готова — через ${seconds} с`,
    empty: [
      (name) => `🎣 @${name} — клює, і тут здобич зривається з гачка!`,
      (name) => `🎣 @${name} — наче клювало, та на гачку порожньо…`,
      (name) => `🎣 @${name} — смикнуло, волосінь порвалася, улов утік`,
    ],
    coins: [
      (name, coins) => `🎣 @${name} — клює, і є улов! +${coinsText(coins)}`,
      (name, coins) => `🎣 @${name} — витягує рибу: +${coinsText(coins)}!`,
      (name, coins) => `🎣 @${name} — риба на гачку, +${coinsText(coins)} 🎉`,
    ],
    xp: (name, xp) => `⚡ @${name} — клює! Улов: +${xp} XP`,
    bank: (name, coins) => `🎣 @${name} — клює! На гачку скриня: ${coinsText(coins)} — у джекпот`,
  },
  pivo: {
    regular: [
      (name) => `🍺 @${name} відкриває холодненьке. Будьмо!`,
      (name) => `🍻 @${name} піднімає тост за Sphere! 🦊`,
      (name) => `🧊 Частую я, @${name}! Чат, дякуйте!`,
      (name) => `🍺 @${name} пригощає весь чат. Салют!`,
      (name) => `⚡ З'явилося дике пиво! @${name} підібрав його. Це супер ефективно!`,
    ],
    golden: (name) => `👑✨ ЗОЛОТЕ ПИВО! @${name} знаходить легендарний напій! 🍺`,
  },
  chestAlert: {
    label: 'скриня зі скарбом',
    toBank: (coins) => `+${coinsText(coins)} у банк`,
  },
};
