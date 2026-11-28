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
  tower: {
    queued: (name, position) => `🗼 @${name}, твій герой у черзі на вежу: місце ${position}`,
    alreadyQueued: (name) => `@${name}, ти вже в черзі на вежу`,
    noAttempts: (name, max) => `@${name}, спроби вежі на сьогодні закінчилися (${max} на день). Приходь завтра!`,
    complete: (name) => `🏆 @${name}, твій герой пройшов усю вежу. Нові поверхи вже в дорозі!`,
    won: (name, hero, floor, enemy, coins, xp, levelUp, left) =>
      `🗼 @${name}: ${hero} переміг ${enemy} на поверсі ${floor}! +${coins} монет, +${xp} досвіду героя${levelUp ? `, рівень ${levelUp}!` : ''}. Спроб залишилось: ${left}`,
    lost: (name, hero, floor, enemy, xp, levelUp, left) =>
      `💀 @${name}: ${hero} програв ${enemy} на поверсі ${floor}. +${xp} досвіду героя${levelUp ? `, рівень ${levelUp}!` : ''}. Спроб залишилось: ${left}`,
  },
  hero: {
    buyUsage: (name, prefix) => `@${name}, пиши: ${prefix}buy hero <ім'я героя> або ${prefix}buy fruit`,
    fruitBought: (name, hero, level, price, coinsAfter) =>
      `🍎 @${name}: ${hero} з'їв фрукт росту і тепер ${level} рівня! -${price} монет, залишилось ${coinsAfter}`,
    fruitNotEnough: (name, hero, price, have, shortfall) =>
      `@${name}, фрукт для ${hero} коштує ${price}, у тебе ${have}: не вистачає ${shortfall}`,
    fruitMaxLevel: (name, hero) => `@${name}, ${hero} вже досяг максимального рівня`,
    useUsage: (name, prefix) => `@${name}, пиши: ${prefix}use hero <ім'я героя>`,
    unknown: (name, heroes) => `@${name}, такого героя немає. Є: ${heroes}`,
    alreadyOwned: (name, hero) => `@${name}, ${hero} у тебе вже є`,
    notEnough: (name, hero, price, have, shortfall) =>
      `@${name}, ${hero} коштує ${price}, у тебе ${have}: не вистачає ${shortfall}`,
    bought: (name, hero, price, coinsAfter, prefix) =>
      price === 0
        ? `🎁 @${name} отримав героя ${hero}! Одягнути: ${prefix}use hero ${hero.toLowerCase()}`
        : `🛒 @${name} купив героя ${hero} за ${price}, лишилось ${coinsAfter}. Одягнути: ${prefix}use hero ${hero.toLowerCase()}`,
    notOwned: (name, hero, prefix) => `@${name}, ${hero} ще не куплений: ${prefix}buy hero ${hero.toLowerCase()}`,
    alreadyActive: (name, hero) => `@${name}, ${hero} вже з тобою`,
    equipped: (name, hero) => `⚔️ @${name} тепер грає за героя ${hero}`,
    shop: (name, items, prefix) =>
      `🛒 @${name}, герої: ${items.map((item) => `${item.name} — ${item.price === 0 ? 'безкоштовно' : item.price}`).join(', ')}. Купити: ${prefix}buy hero <ім'я>`,
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
  vip: {
    added: (mod, name) => `🎉 НОВИЙ VIP! 🎉 @${mod} щойно зробив(ла) @${name} VIP! Підтримайте гучно в чаті! 💎✨`,
    removed: (mod, name) => `✨ VIP-статус знято: @${mod} змінив(ла) права @${name}.`,
    usage: (name, prefix, command) => `@${name}, вкажи нік: ${prefix}${command} <нік>`,
    notFound: (name) => `Користувача @${name} не знайдено в Twitch.`,
    denied: (name) => `@${name}, у тебе немає прав на цю команду!`,
    failed: (name) => `⚠️ @${name}, Twitch не прийняв зміну. Спробуй пізніше.`,
  },
  founder: {
    added: (mod, name) => `🏅 @${mod} робить @${name} засновником (founder)! Бонус XP за повідомлення увімкнено. 🎉`,
    removed: (mod, name) => `✨ Статус засновника знято: @${mod} змінив(ла) права @${name}.`,
    usage: (name, prefix, command) => `@${name}, вкажи нік: ${prefix}${command} <нік>`,
    notFound: (name) => `Користувача @${name} не знайдено в Twitch.`,
    denied: (name) => `@${name}, у тебе немає прав на цю команду!`,
    failed: (name) => `⚠️ @${name}, не вдалося змінити статус. Спробуй пізніше.`,
  },
  reward: (name, title) => `🎁 @${name} активує нагороду «${title}»! Дякую, що витрачаєш бали! 💜`,
  exchange: (name, title, coins) => `💰 @${name} обміняв(ла) бали: «${title}» → +${coins} монет!`,
  leaderboard: (name, top, yourRank) => `🏆 @${name} хизується лідербордом! Топ-5 за XP: ${top}${yourRank ? ` Ти на ${yourRank} місці.` : ''}`,
  denied: (name) => `@${name}, у тебе немає прав на цю команду!`,
  xpBoost: {
    started: (name, minutes, multiplier) => `⚡ @${name} вмикає буст XP ×${multiplier} на ${count(minutes, 'хвилину', 'хвилини', 'хвилин')}! 🚀`,
    usage: (name, prefix, min, max) => `@${name}, використання: ${prefix}xpboost <${min}-${max}> — тривалість у хвилинах, або ${prefix}xpboost off.`,
    cancelled: (name) => `⚡ @${name} скасовує буст XP! 🛑`,
    noActive: (name) => `@${name}, зараз немає активного буста XP, який можна скасувати.`,
  },
  timer: {
    started: (name, minutes, title) => `@${name}, таймер "${title}" запущено на ${count(minutes, 'хвилину', 'хвилини', 'хвилин')}! ⏳`,
    usage: (name, prefix) => `@${name}, час має бути числом! Приклад: ${prefix}timer 60 cyan Мій таймер`,
    stopped: (name) => `@${name}, таймер зупинено. ⏹️`,
  },
  chestAlert: {
    label: 'скриня зі скарбом',
    toBank: (coins) => `+${coinsText(coins)} у банк`,
  },
  lottery: {
    ticketEarned: (name) => `🎉 @${name} набирає потрібну кількість тижневого XP і отримує квиток VIP-лотереї! Удачі! 🎫✨`,
    ticketHave: (name) => `🎫 @${name}, у тебе вже є тижневий квиток VIP-лотереї! Розслабся й чекай розіграшу. 🎉`,
    ticketProgress: (name, xp, threshold) =>
      `💪 @${name}: ${xp}/${threshold} XP для тижневої VIP-лотереї. Ще ${threshold - xp} XP до квитка! 🎟️`,
    alreadyRunning: (name) => `@${name}, лотерея вже йде — тримай квитки міцніше! 🎰`,
    start: '🎰 Тижнева VIP-лотерея стартує! Переможців визначаємо на оверлеї... 🎰',
    final: '✨ Усі VIP-статуси роздано, переможці на екрані! До зустрічі наступного тижня! ✨',
    vipFailed: (name) => `⚠️ Не вдалося видати VIP для @${name}. Можливо, у каналу закінчилися VIP-слоти!`,
    postponed: '⚠ Цього тижня ніхто не отримав квиток лотереї. Розіграш відкладено! 💪',
    noTicketsYet: '⚠ Цього тижня ще ніхто не отримав квиток лотереї. Будь першим! 💪',
    totalTickets: (count) => `📊 Власників VIP-квитків цього тижня: ${count}.`,
    ticketList: (names, count, threshold) =>
      `🎟️ Учасники VIP-лотереї (${count}): ${names}. ✨ Набери ${threshold} XP до кінця тижня!`,
  },
  lotteryScene: {
    label: 'тижневий розіграш',
    title: 'VIP-лотерея',
    intro: 'розіграш починається',
    drawing: 'обираємо переможців…',
    finale: 'нові VIP тижня',
    entries: 'учасників',
    newVip: 'новий vip',
    extended: 'продовжено',
    until: 'vip до наступного розіграшу',
    listLabel: 'тижневі квитки',
    listTitle: (count) => `Квитків: ${count}`,
    more: (count) => `+ ще ${count}`,
    ticketLabel: 'квиток лотереї',
    ticketDetail: 'удачі в тижневому розіграші',
  },
};
