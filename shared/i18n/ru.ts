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
  tower: {
    queued: (name, position) => `🗼 @${name}, твой герой в очереди на башню: место ${position}`,
    alreadyQueued: (name) => `@${name}, ты уже в очереди на башню`,
    noAttempts: (name, max) => `@${name}, попытки башни на сегодня кончились (${max} в день). Приходи завтра!`,
    complete: (name) => `🏆 @${name}, твой герой прошёл всю башню. Новые этажи уже в пути!`,
    won: (name, hero, floor, enemy, coins, xp, levelUp, left) =>
      `🗼 @${name}: ${hero} победил ${enemy} на этаже ${floor}! +${coins} монет, +${xp} опыта героя${levelUp ? `, уровень ${levelUp}!` : ''}. Попыток осталось: ${left}`,
    lost: (name, hero, floor, enemy, xp, levelUp, left) =>
      `💀 @${name}: ${hero} проиграл ${enemy} на этаже ${floor}. +${xp} опыта героя${levelUp ? `, уровень ${levelUp}!` : ''}. Попыток осталось: ${left}`,
  },
  hero: {
    buyUsage: (name, prefix) => `@${name}, пиши: ${prefix}buy hero <имя героя>`,
    useUsage: (name, prefix) => `@${name}, пиши: ${prefix}use hero <имя героя>`,
    unknown: (name, heroes) => `@${name}, такого героя нет. Есть: ${heroes}`,
    alreadyOwned: (name, hero) => `@${name}, ${hero} у тебя уже есть`,
    notEnough: (name, hero, price, have, shortfall) =>
      `@${name}, ${hero} стоит ${price}, у тебя ${have}: не хватает ${shortfall}`,
    bought: (name, hero, price, coinsAfter, prefix) =>
      price === 0
        ? `🎁 @${name} получил героя ${hero}! Надеть: ${prefix}use hero ${hero.toLowerCase()}`
        : `🛒 @${name} купил героя ${hero} за ${price}, осталось ${coinsAfter}. Надеть: ${prefix}use hero ${hero.toLowerCase()}`,
    notOwned: (name, hero, prefix) => `@${name}, ${hero} ещё не куплен: ${prefix}buy hero ${hero.toLowerCase()}`,
    alreadyActive: (name, hero) => `@${name}, ${hero} уже с тобой`,
    equipped: (name, hero) => `⚔️ @${name} теперь играет за героя ${hero}`,
    shop: (name, items, prefix) =>
      `🛒 @${name}, герои: ${items.map((item) => `${item.name} — ${item.price === 0 ? 'бесплатно' : item.price}`).join(', ')}. Купить: ${prefix}buy hero <имя>`,
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
  founder: {
    added: (mod, name) => `🏅 @${mod} делает @${name} основателем (founder)! Бонус XP за сообщения включён. 🎉`,
    removed: (mod, name) => `✨ Статус основателя снят: @${mod} изменил(а) права @${name}.`,
    usage: (name, prefix, command) => `@${name}, укажи ник: ${prefix}${command} <ник>`,
    notFound: (name) => `Пользователь @${name} не найден в Twitch.`,
    denied: (name) => `@${name}, у тебя нет прав на эту команду!`,
    failed: (name) => `⚠️ @${name}, не удалось изменить статус. Попробуй позже.`,
  },
  reward: (name, title) => `🎁 @${name} активирует награду «${title}»! Спасибо, что тратишь баллы! 💜`,
  exchange: (name, title, coins) => `💰 @${name} обменял(а) баллы: «${title}» → +${coins} монет!`,
  leaderboard: (name, top, yourRank) => `🏆 @${name} хвастается лидербордом! Топ-5 по XP: ${top}${yourRank ? ` Ты на ${yourRank} месте.` : ''}`,
  denied: (name) => `@${name}, у тебя нет прав на эту команду!`,
  xpBoost: {
    started: (name, minutes, multiplier) => `⚡ @${name} включает буст XP ×${multiplier} на ${count(minutes, 'минуту', 'минуты', 'минут')}! 🚀`,
    usage: (name, prefix, min, max) => `@${name}, использование: ${prefix}xpboost <${min}-${max}> — длительность в минутах, или ${prefix}xpboost off.`,
    cancelled: (name) => `⚡ @${name} отменяет буст XP! 🛑`,
    noActive: (name) => `@${name}, сейчас нет активного буста XP, который можно отменить.`,
  },
  timer: {
    started: (name, minutes, title) => `@${name}, таймер "${title}" запущен на ${count(minutes, 'минуту', 'минуты', 'минут')}! ⏳`,
    usage: (name, prefix) => `@${name}, время должно быть числом! Пример: ${prefix}timer 60 cyan Мой таймер`,
    stopped: (name) => `@${name}, таймер остановлен. ⏹️`,
  },
  chestAlert: {
    label: 'сундук с сокровищем',
    toBank: (coins) => `+${coinsText(coins)} в банк`,
  },
  lottery: {
    ticketEarned: (name) => `🎉 @${name} набирает нужное количество недельного XP и получает билет VIP-лотереи! Удачи! 🎫✨`,
    ticketHave: (name) => `🎫 @${name}, у тебя уже есть недельный билет VIP-лотереи! Расслабься и жди розыгрыша. 🎉`,
    ticketProgress: (name, xp, threshold) =>
      `💪 @${name}: ${xp}/${threshold} XP для недельной VIP-лотереи. Ещё ${threshold - xp} XP до билета! 🎟️`,
    alreadyRunning: (name) => `@${name}, лотерея уже идёт — держи билеты крепче! 🎰`,
    start: '🎰 Недельная VIP-лотерея стартует! Определяем победителей на оверлее... 🎰',
    final: '✨ Все VIP-статусы розданы, победители на экране! До встречи на следующей неделе! ✨',
    vipFailed: (name) => `⚠️ Не удалось выдать VIP для @${name}. Возможно, у канала закончились VIP-слоты!`,
    postponed: '⚠ На этой неделе никто не получил билет лотереи. Розыгрыш отложен! 💪',
    noTicketsYet: '⚠ На этой неделе ещё никто не получил билет лотереи. Будь первым! 💪',
    totalTickets: (count) => `📊 Владельцев VIP-билетов на этой неделе: ${count}.`,
    ticketList: (names, count, threshold) =>
      `🎟️ Участники VIP-лотереи (${count}): ${names}. ✨ Набери ${threshold} XP до конца недели!`,
  },
  lotteryScene: {
    label: 'недельный розыгрыш',
    title: 'VIP-лотерея',
    intro: 'розыгрыш начинается',
    drawing: 'выбираем победителей…',
    finale: 'новые VIP недели',
    entries: 'участников',
    newVip: 'новый vip',
    extended: 'продлён',
    until: 'vip до следующего розыгрыша',
    listLabel: 'недельные билеты',
    listTitle: (count) => `Билетов: ${count}`,
    more: (count) => `+ ещё ${count}`,
    ticketLabel: 'билет лотереи',
    ticketDetail: 'удачи в недельном розыгрыше',
  },
};
