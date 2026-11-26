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
  chestAlert: {
    label: 'treasure chest',
    toBank: (coins) => `+${coins} coins to the bank`,
  },
};
