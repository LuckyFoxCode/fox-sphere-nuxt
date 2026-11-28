// Тестовые алерты и карточки из админки: те же события оверлея, что шлёт бот, с придуманными данными.
// В базу, чат и Twitch ничего не пишется. Эмулятор /dev/events гибче и живёт отдельно: в проде он выключен.
import { watchStreakReward } from './economy';
import type { ProfileShowPayload, ServerToClientEvents } from './events';
import { FISH_CATCHES } from './fishing';
import { DEFAULT_HERO_ID } from './heroes';
import type { Lang } from './i18n';
import { getGoldenBeerTier } from './pivo';
import { getLevelRange } from './xp';

export const TEST_EVENTS = [
  { kind: 'follow', label: 'Follow', group: 'alert' },
  { kind: 'raid', label: 'Рейд', group: 'alert' },
  { kind: 'reward', label: 'Награда за баллы', group: 'alert' },
  { kind: 'sub-new', label: 'Новая подписка', group: 'alert' },
  { kind: 'sub-resub', label: 'Продление подписки', group: 'alert' },
  { kind: 'sub-gift', label: 'Подарочные подписки', group: 'alert' },
  { kind: 'bits', label: 'Bits', group: 'alert' },
  { kind: 'watch-streak', label: 'Watch streak', group: 'alert' },
  { kind: 'chest', label: 'Сундук из рыбалки', group: 'alert' },
  { kind: 'golden-beer', label: 'Золотое пиво', group: 'alert' },
  { kind: 'add-vip', label: 'Новый VIP', group: 'alert' },
  { kind: 'lottery-ticket', label: 'Билет лотереи', group: 'alert' },
  { kind: 'level-up', label: 'Level up', group: 'alert' },
  { kind: 'hero-level-up', label: 'Level up героя', group: 'alert' },
  { kind: 'profile', label: 'Профиль', group: 'card' },
  { kind: 'shop', label: 'Магазин героев', group: 'card' },
  { kind: 'leaderboard', label: 'Лидерборд', group: 'card' },
] as const;

export type TestEventKind = (typeof TEST_EVENTS)[number]['kind'];

export const isTestEventKind = (value: unknown): value is TestEventKind =>
  TEST_EVENTS.some((item) => item.kind === value);

// Ник на Twitch не длиннее 25 символов
export const TEST_NAME_MAX = 25;
export const parseTestName = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const name = value.trim();
  return name.length > 0 && name.length <= TEST_NAME_MAX ? name : null;
};

// Пример карточки профиля (он же в /dev)
export const PROFILE_SAMPLE: ProfileShowPayload = {
  userId: 'dev-luckyfoxcode',
  username: 'luckyfoxcode',
  displayName: 'LuckyFoxCode',
  color: '#ff6a3d',
  lvl: 14,
  xp: 620,
  startXp: 450,
  maxXp: 750,
  coins: 4180,
  heroId: 'assassin',
  heroLevel: 7,
  heroXp: 140,
  bestStreak: 60,
  goldenBeers: 13,
  isBroadcaster: false,
  isMod: false,
  isFounder: true,
  isSubscriber: true,
  isVip: false,
  isPermanentVip: false,
  isLuckyVip: true,
  isFollower: true,
  earned: 17,
  badges: [
    { category: 'jackpot', level: 2, rarity: 2, value: 2 },
    { category: 'prize1000', level: 3, rarity: 3, value: 5 },
    { category: 'golden-beer', level: 5, rarity: 5, value: 13 },
    { category: 'watch-streak', level: 9, rarity: 4, value: 60 },
  ],
};

const LEADERBOARD_SAMPLE = [
  { rank: 1, userId: 'test-1', username: 'FoxMaster', lvl: 42, xp: 128_400 },
  { rank: 2, userId: 'test-2', username: 'Beerbaron', lvl: 37, xp: 96_150 },
  { rank: 3, userId: 'test-3', username: 'night_owl', lvl: 31, xp: 71_020 },
  { rank: 4, userId: 'test-4', username: 'Pixelka', lvl: 28, xp: 55_300 },
  { rank: 5, userId: 'test-5', username: 'mr_coin', lvl: 25, xp: 43_870 },
];

type Emit = <E extends keyof ServerToClientEvents>(event: E, ...args: Parameters<ServerToClientEvents[E]>) => void;

export type TestEventOptions = {
  username: string;
  // Язык бота: на нём подписи сундука и билета
  lang: Lang;
  // Префикс команд бота: подсказка «как купить» в магазине
  prefix: string;
};

export const emitTestEvent = (emit: Emit, kind: TestEventKind, { username, lang, prefix }: TestEventOptions): void => {
  // Каждый раз новый зритель: повторный follow того же зрителя оверлей минуту пропускает
  const userId = `test-${Date.now()}`;
  const who = { userId, username };

  switch (kind) {
    case 'follow':
      return emit('twitch:follow', who);
    case 'raid':
      return emit('twitch:raid', { raiderId: userId, raiderName: username, viewers: 42 });
    case 'reward':
      return emit('twitch:reward-redeem', { ...who, rewardTitle: 'Test reward', redemptionId: userId });
    case 'sub-new':
      return emit('twitch:sub', { kind: 'new', ...who, tier: '1000' });
    case 'sub-resub':
      return emit('twitch:sub', { kind: 'resub', ...who, tier: '1000', months: 6 });
    case 'sub-gift':
      return emit('twitch:sub', { kind: 'gift', username, tier: '1000', amount: 5 });
    case 'bits':
      return emit('twitch:bits', { username, bits: 100 });
    case 'watch-streak': {
      const { xp, coins } = watchStreakReward(7, false);
      return emit('twitch:watch-streak', {
        ...who,
        streakValue: 7,
        xpAwarded: xp,
        coinsAwarded: coins,
        isRepeat: false,
      });
    }
    case 'chest':
      return emit('fishing:chest', { ...who, coinAmount: FISH_CATCHES.bank200.bankAmount, lang });
    case 'golden-beer': {
      const count = 7;
      const tier = getGoldenBeerTier(count);
      return emit('twitch:golden-beer', {
        ...who,
        goldenBeers: count,
        tier,
        isNewTier: tier > getGoldenBeerTier(count - 1),
      });
    }
    case 'add-vip':
      return emit('twitch:add-vip', who);
    case 'lottery-ticket':
      return emit('lottery:ticket', { ...who, lang });
    case 'level-up': {
      const level = 12;
      const { startXp, maxXp } = getLevelRange(level);
      return emit('user:level-up', {
        ...who,
        newLevel: level,
        fromLevel: level - 1,
        xp: Math.round((startXp + maxXp) / 2),
        heroId: DEFAULT_HERO_ID,
        heroLevel: 6,
      });
    }
    case 'hero-level-up':
      return emit('hero:level-up', { ...who, heroId: DEFAULT_HERO_ID, fromLevel: 5, newLevel: 6 });
    case 'profile':
      return emit('profile:show', { ...PROFILE_SAMPLE, userId, username: username.toLowerCase(), displayName: username });
    case 'shop':
      return emit('shop:show', {
        userId,
        displayName: username,
        coins: 500,
        ownedHeroIds: [DEFAULT_HERO_ID],
        activeHeroId: DEFAULT_HERO_ID,
        prefix,
      });
    case 'leaderboard':
      return emit('leaderboard:show', {
        requesterId: userId,
        requesterName: username,
        entries: LEADERBOARD_SAMPLE,
        you: { rank: 18, userId, username, lvl: 9, xp: 2_340 },
      });
  }
};
