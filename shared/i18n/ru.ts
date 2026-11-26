// Русский. Рыбалка, профиль и новый уровень зрителя — прежние тексты бота; остальное переведено.
import { counter } from './plural';
import type { BotMessages } from './types';

const count = counter('ru');
const coinsText = (coins: number) => count(coins, 'монета', 'монеты', 'монет');

export const ru: BotMessages = {
  levelUp: (name, lvl) => `@${name} достиг(ла) уровня ${lvl}! 🎉`,
  streamLevelUp: (lvl) => `⚡ НОВЫЙ УРОВЕНЬ СТРИМА! Теперь у нас уровень ${lvl}! Продолжайте писать в чат! 🚀`,
  follow: (name) => `🎉 Спасибо за фоллоу, @${name}! Добро пожаловать в семью Foxsphere! 🚀`,
  raid: (name, viewers) =>
    `⚡ @${name} залетает с рейдом: ${count(viewers, 'зритель', 'зрителя', 'зрителей')}! Добро пожаловать в Sphere! 🦊🌐✨`,
  coins: (name, coins) => `@${name}, у тебя ${coinsText(coins)}`,
  profile: (name, { lvl, xp, xpToNext, coins, rank }) =>
    `@${name}: уровень ${lvl}, XP ${xp}/${xpToNext} до следующего, монет ${coins}, место в топе #${rank}`,
  spin: {
    cooldown: (name, seconds, prefix) => `⏳ @${name}, не так быстро! ${prefix}spin снова через ${seconds} с`,
    notEnough: (name, price, have) => `@${name}, не хватает монет: нужно ${price}, у тебя ${have}`,
    coins: (name, coins) => `💰 @${name} вылавливает ${coinsText(coins)}!`,
    xp: (name, xp) => `⚡ @${name} получает ${xp} XP!`,
    jackpotAnnounce: (name) => `👑 @${name} СРЫВАЕТ ДЖЕКПОТ!`,
    jackpotResult: (name, coins, bank) => `🎰 @${name} забирает джекпот: ${coinsText(coins)}! Новый банк: ${bank}`,
    statsNone: (name, prefix) => `@${name}, у тебя ещё нет спинов — жми ${prefix}spin! 🎰`,
    stats: (name, spins, win, loss) => `🎰 @${name}: спинов ${spins}, выиграно ${win}, проиграно ${loss}`,
  },
  fish: {
    cast: (name) => `@${name} забросил удочку…`,
    already: (name) => `@${name}, ты уже рыбачишь`,
    cooldown: (name, seconds) => `⏳ @${name}, удочка не готова — через ${seconds}s`,
    empty: [
      (name) => `🎣 @${name} — клюёт, и тут сорвалась с крючка!`,
      (name) => `🎣 @${name} — клюёт было, да на крючке оказалось пусто…`,
      (name) => `🎣 @${name} — дёрнуло, леска порвалась, улов ушёл`,
    ],
    coins: [
      (name, coins) => `🎣 @${name} — клюёт и вылавливает! +${coins} монет`,
      (name, coins) => `🎣 @${name} — вытащил рыбу на +${coins} монет!`,
      (name, coins) => `🎣 @${name} — на крючке рыба, +${coins} монет 🎉`,
    ],
    xp: (name, xp) => `⚡ @${name} — клюёт! Выловил +${xp} XP`,
    bank: (name, coins) => `🎣 @${name} — клюёт! Вытащил сундук: ${coins} монет ушли в джекпот`,
  },
  pivo: {
    regular: [
      (name) => `🍺 @${name} открывает холодненькое. Будем!`,
      (name) => `🍻 @${name} поднимает тост за Sphere! 🦊`,
      (name) => `🧊 Угощаю я, @${name}! Чат, говорите спасибо!`,
      (name) => `🍺 @${name} угощает весь чат. Салют!`,
      (name) => `⚡ Появилось дикое пиво! @${name} подобрал его. Это супер эффективно!`,
    ],
    golden: (name) => `👑✨ ЗОЛОТОЕ ПИВО! @${name} находит легендарный напиток! 🍺`,
  },
  vip: {
    added: (mod, name) => `🎉 НОВЫЙ VIP! 🎉 @${mod} только что сделал(а) @${name} VIP! Поддержим громко в чате! 💎✨`,
    removed: (mod, name) => `✨ VIP-статус снят: @${mod} изменил(а) права @${name}.`,
    usage: (name, prefix, command) => `@${name}, укажи ник: ${prefix}${command} <ник>`,
    notFound: (name) => `Пользователь @${name} не найден в Twitch.`,
    denied: (name) => `@${name}, у тебя нет прав на эту команду!`,
    failed: (name) => `⚠️ @${name}, Twitch не принял изменение. Попробуй позже.`,
  },
  chestAlert: {
    label: 'сундук с сокровищем',
    toBank: (coins) => `+${coinsText(coins)} в банк`,
  },
};
