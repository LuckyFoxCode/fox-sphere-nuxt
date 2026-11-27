// Английский, язык по умолчанию. Где у старого fox-sphere был английский текст (уровни, follow,
// рейд, кошелёк, рулетка), он взят как есть; рыбалка и профиль переведены.
import type { BotMessages } from './types';

export const en: BotMessages = {
  levelUp: (name, lvl) => `⚡ @${name} leveled up to Level ${lvl}! 🚀 GG!`,
  streamLevelUp: (lvl) => `⚡ STREAM LEVEL UP! We are now Level ${lvl}! Keep spamming those messages! 🚀`,
  follow: (name) => `🎉 Thanks for the follow, @${name}! Welcome to the Foxsphere family! 🚀`,
  raid: (name, viewers) => `⚡ @${name} just raided with ${viewers} viewers! Welcome to the Sphere! 🦊🌐✨`,
  coins: (name, coins) => `💰 Wallet • @${name} ➔ ${coins} Coins 🪙`,
  profile: (name, { lvl, xp, xpToNext, coins, rank }) =>
    `@${name}: level ${lvl}, XP ${xp}/${xpToNext} to the next one, coins ${coins}, rank #${rank}`,
  spin: {
    cooldown: (name, seconds, prefix) => `⏳ @${name}, not so fast! ${prefix}spin again in ${seconds}s`,
    notEnough: (name, price, have) => `@${name}, not enough coins: you need ${price}, you have ${have}`,
    coins: (name, coins) => `💰 @${name} fished out ${coins} coins!`,
    xp: (name, xp) => `⚡ @${name} grabbed ${xp} XP!`,
    jackpotAnnounce: (name) => `👑 @${name} HITS THE JACKPOT!`,
    jackpotResult: (name, coins, bank) => `🎰 @${name} takes ${coins} jackpot coins! Bank updated: ${bank}`,
    statsNone: (name, prefix) => `@${name}, you haven't spun yet — hit ${prefix}spin! 🎰`,
    stats: (name, spins, win, loss) => `🎰 @${name}: spun ${spins} times, won ${win}, lost ${loss}`,
  },
  fish: {
    cast: (name) => `@${name} cast the line…`,
    already: (name) => `@${name}, you're already fishing`,
    cooldown: (name, seconds) => `⏳ @${name}, the rod isn't ready — try again in ${seconds}s`,
    empty: [
      (name) => `🎣 @${name} — a bite, and it slipped off the hook!`,
      (name) => `🎣 @${name} — there was a bite, but the hook came up empty…`,
      (name) => `🎣 @${name} — a tug, the line snapped and the catch got away`,
    ],
    coins: [
      (name, coins) => `🎣 @${name} — a bite, and it's landed! +${coins} coins`,
      (name, coins) => `🎣 @${name} — pulled out a fish worth +${coins} coins!`,
      (name, coins) => `🎣 @${name} — fish on the hook, +${coins} coins 🎉`,
    ],
    xp: (name, xp) => `⚡ @${name} — a bite! Caught +${xp} XP`,
    bank: (name, coins) => `🎣 @${name} — a bite! Pulled out a chest: ${coins} coins went to the jackpot`,
  },
  hero: {
    buyUsage: (name, prefix) => `@${name}, type: ${prefix}buy hero <hero name>`,
    useUsage: (name, prefix) => `@${name}, type: ${prefix}use hero <hero name>`,
    unknown: (name, heroes) => `@${name}, no such hero. Available: ${heroes}`,
    alreadyOwned: (name, hero) => `@${name}, you already own ${hero}`,
    notEnough: (name, hero, price, have, shortfall) =>
      `@${name}, ${hero} costs ${price}, you have ${have}: ${shortfall} short`,
    bought: (name, hero, price, coinsAfter, prefix) =>
      price === 0
        ? `🎁 @${name} got the hero ${hero}! Equip it: ${prefix}use hero ${hero.toLowerCase()}`
        : `🛒 @${name} bought the hero ${hero} for ${price}, ${coinsAfter} left. Equip it: ${prefix}use hero ${hero.toLowerCase()}`,
    notOwned: (name, hero, prefix) => `@${name}, you don't own ${hero} yet: ${prefix}buy hero ${hero.toLowerCase()}`,
    alreadyActive: (name, hero) => `@${name}, ${hero} is already your hero`,
    equipped: (name, hero) => `⚔️ @${name} now plays as ${hero}`,
    shop: (name, items, prefix) =>
      `🛒 @${name}, heroes: ${items.map((item) => `${item.name} — ${item.price === 0 ? 'free' : item.price}`).join(', ')}. Buy: ${prefix}buy hero <name>`,
  },
  pivo: {
    regular: [
      (name) => `🍺 @${name} cracks open a cold one. Cheers!`,
      (name) => `🍻 @${name} raises a toast to the Sphere! 🦊`,
      (name) => `🧊 Drinks on @${name}! Chat, say thanks!`,
      (name) => `🍺 @${name} shares a round with the whole chat. Salud!`,
      (name) => `⚡ A wild beer appears! @${name} picked it up. It's super effective!`,
    ],
    golden: (name) => `👑✨ GOLDEN BEER! @${name} found the legendary brew! 🍺`,
  },
  vip: {
    added: (mod, name) => `🎉 NEW VIP ALERT! 🎉 @${mod} has just made @${name} a VIP! Drop some hype in the chat! 💎✨`,
    removed: (mod, name) => `✨ VIP status removed: @${mod} has updated @${name}'s permissions.`,
    usage: (name, prefix, command) => `@${name}, please specify a username: ${prefix}${command} <username>`,
    notFound: (name) => `User @${name} not found on Twitch.`,
    denied: (name) => `@${name}, you don't have permission to use this command!`,
    failed: (name) => `⚠️ @${name}, Twitch didn't accept the change. Try again later.`,
  },
  founder: {
    added: (mod, name) => `🏅 @${mod} has made @${name} a founder! The message XP bonus is on. 🎉`,
    removed: (mod, name) => `✨ Founder status removed: @${mod} has updated @${name}'s permissions.`,
    usage: (name, prefix, command) => `@${name}, please specify a username: ${prefix}${command} <username>`,
    notFound: (name) => `User @${name} not found on Twitch.`,
    denied: (name) => `@${name}, you don't have permission to use this command!`,
    failed: (name) => `⚠️ @${name}, couldn't change the status. Try again later.`,
  },
  reward: (name, title) => `🎁 @${name} redeems "${title}"! Thanks for spending your points! 💜`,
  exchange: (name, title, coins) => `💰 @${name} exchanged channel points: "${title}" → +${coins} coins!`,
  leaderboard: (name, top, yourRank) => `🏆 @${name} flexes the leaderboard! Top 5 by XP: ${top}${yourRank ? ` You are #${yourRank}.` : ''}`,
  denied: (name) => `@${name}, you don't have permission to use this command!`,
  xpBoost: {
    started: (name, minutes, multiplier) => `⚡ @${name} activated an XP ×${multiplier} boost for ${minutes} minutes! 🚀`,
    usage: (name, prefix, min, max) => `@${name}, usage: ${prefix}xpboost <${min}-${max}> — duration in minutes, or ${prefix}xpboost off.`,
    cancelled: (name) => `⚡ @${name} cancelled the XP boost! 🛑`,
    noActive: (name) => `@${name}, there is no active XP boost to cancel.`,
  },
  timer: {
    started: (name, minutes, title) => `@${name}, timer "${title}" started for ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}! ⏳`,
    usage: (name, prefix) => `@${name}, time must be a number! Example: ${prefix}timer 60 cyan My cool timer`,
    stopped: (name) => `@${name}, timer stopped. ⏹️`,
  },
  chestAlert: {
    label: 'treasure chest',
    toBank: (coins) => `+${coins} coins to the bank`,
  },
  lottery: {
    ticketEarned: (name) => `🎉 @${name} earned enough weekly XP and received a VIP Lottery Ticket! Good luck! 🎫✨`,
    ticketHave: (name) => `🎫 @${name}, you already have your weekly VIP Lottery Ticket! Sit back and relax. 🎉`,
    ticketProgress: (name, xp, threshold) =>
      `💪 @${name}, you've earned ${xp}/${threshold} XP for the weekly VIP Lottery. ${threshold - xp} XP to go for your VIP Lottery Ticket! 🎟️`,
    alreadyRunning: (name) => `@${name}, the lottery is already running — hold on to your tickets! 🎰`,
    start: '🎰 Weekly Lottery Started! Drawing the VIP winners on the overlay... 🎰',
    final: '✨ All VIP statuses are handed out, winners are on screen! See you next week! ✨',
    vipFailed: (name) => `⚠️ Failed to grant VIP to @${name}. The channel might be out of VIP slots!`,
    postponed: '⚠ No one managed to get a Lottery Ticket this week. The lottery is postponed! 💪',
    noTicketsYet: '⚠ No one has earned a Lottery Ticket yet this week. Be the first! 💪',
    totalTickets: (count) => `📊 Total VIP ticket holders this week: ${count} users.`,
    ticketList: (names, count, threshold) =>
      `🎟️ VIP lottery participants: ${count} people: ${names}. ✨ Earn ${threshold} XP before the end of the week!`,
  },
  lotteryScene: {
    label: 'weekly draw',
    title: 'VIP lottery',
    intro: 'the draw begins',
    drawing: 'drawing the winners…',
    finale: 'new VIPs of the week',
    entries: 'entries',
    newVip: 'new vip',
    extended: 'extended',
    until: 'vip until the next draw',
    listLabel: 'weekly tickets',
    listTitle: (count) => `${count} ticket holders`,
    more: (count) => `+${count} more`,
    ticketLabel: 'lottery ticket',
    ticketDetail: 'good luck in the weekly draw',
  },
};
