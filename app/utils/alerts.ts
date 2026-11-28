// Тексты, цвета, звуки и длительность алертов. События отличаются только данными, отдельная
// наклейка лишь у сундука. follow, raid и reward перенесены из старого fox-sphere как есть;
// подписок и алерта сундука там не было.
import type {
  AddVipPayload,
  BitsPayload,
  FishingChestPayload,
  FollowPayload,
  GoldenBeerPayload,
  LotteryTicketPayload,
  RaidPayload,
  RewardRedeemPayload,
  SubPayload,
  SubTier,
  HeroLevelUpPayload,
  UserLevelUpPayload,
  WatchStreakPayload,
} from '#shared/events';
import { achievementArtPath, achievementLevel, findCategory } from '#shared/achievements';
import { MESSAGES } from '#shared/i18n';
import { goldenBeerArtPath, goldenBeerTierLabel } from '#shared/pivo';

// chest — сундук из рыбалки: у него своя наклейка (ChestAlert), у остальных — EventSticker.
// beer — золотое пиво: на пластине не значок, а арт ступени
export type AlertKind =
  | 'follow'
  | 'raid'
  | 'reward'
  | 'sub'
  | 'chest'
  | 'beer'
  | 'vip'
  | 'ticket'
  | 'bits'
  | 'streak'
  | 'levelup'
  | 'herolevelup';

export interface AlertView {
  kind: AlertKind;
  /** Классы бумаги пластины целиком: `bg-paper-${x}` Tailwind не увидит */
  paper: string;
  label: string;
  title: string;
  detail?: string;
  /** Крупное число в плитке справа: месяцы подписки, число подарков */
  stat?: { value: string; unit: string };
  chips?: string[];
  /** Арт достижения вместо значка: занимает пластину целиком */
  media?: { src: string; alt: string };
  /** Level up: данные для отдельной карточки (LevelUpCard), как у сундука своя наклейка */
  levelUp?: UserLevelUpPayload;
  /** Level up героя: данные для HeroLevelUpCard */
  heroLevelUp?: HeroLevelUpPayload;
  /** Овсяный чип в углу — флаг, не факт (например, «new tier») */
  tag?: string;
  /** Адрес звука из public/; null — алерт без звука */
  sound: string | null;
  /** Задержка звука от появления наклейки */
  soundDelayMs?: number;
  durationMs: number;
}

const ALERT_DURATION_MS = 5000;
// Level up: на карточке портрет, ранг, полоса XP и статы героя, их надо успеть прочитать
const LEVEL_UP_ALERT_DURATION_MS = 6500;
const HERO_LEVEL_UP_ALERT_DURATION_MS = 5500;
// Чуть дольше обычного: первую секунду занимает открытие сундука
const CHEST_ALERT_DURATION_MS = 5500;
// Пик звука приходится на открытие крышки (около 0,9 с)
const CHEST_SOUND_DELAY_MS = 300;
// Золотое пиво висит дольше: на пластине арт ступени, его надо успеть рассмотреть (как в старом проекте)
const BEER_ALERT_DURATION_MS = 7000;
// Watch streak тоже 7 с, как в старом проекте: на пластине арт рубежа
const STREAK_ALERT_DURATION_MS = 7000;

export const ALERT_SOUNDS: Record<AlertKind, string | null> = {
  follow: '/assets/sound/follow.mp3',
  raid: '/assets/sound/raid.mp3',
  reward: '/assets/sound/knock.wav',
  // В старом проекте звука подписки не было: sub.mp3 синтезирован с нуля (мягкий колокольчик, E5-G5-B5-E6),
  // чужих файлов и лицензий нет. Заменить на свой можно, подменив файл или адрес здесь.
  sub: '/assets/sound/sub.mp3',
  // Взят из имеющихся (в старом проекте это звук watch streak, он ещё не перенесён).
  // jackpot.mp3 и одинаковый с ним add-vip.mp3 не берём: сундук не должен звучать как джекпот.
  chest: '/assets/sound/streak.mp3',
  // В старом проекте золотое пиво шло без звука
  beer: null,
  // Тот же файл, что в старом проекте у add-vip
  vip: '/assets/sound/add-vip.mp3',
  // Звук билета из старого проекта
  ticket: '/assets/sound/ticket.mp3',
  // В старом проекте Bits не было: bits.mp3 синтезирован (короткий «звяк монеты»)
  bits: '/assets/sound/bits.mp3',
  // streak.mp3 из старого проекта занят сундуком, поэтому у стрика свой звук: watch-streak.mp3
  // синтезирован (бодрый восходящий аккорд, около 1,3 с), чужих файлов и лицензий нет
  streak: '/assets/sound/watch-streak.mp3',
  // В старом проекте был level-up.mp3, но он не перенесён: level-up.mp3 синтезирован с нуля (быстрый подъём
  // G-C-E-G и яркий мажорный аккорд, около 1,5 с), чужих файлов и лицензий нет
  levelup: '/assets/sound/level-up.mp3',
  herolevelup: '/assets/sound/level-up.mp3',
};

const plural = (count: number, word: string): string => (count === 1 ? word : `${word}s`);

// Уровень подписки стоит в микролейбле: отдельный чип делал стикер выше остальных
const withTier = (label: string, tier: SubTier): string => `${label} · tier ${tier[0]}`;

export const followAlert = ({ username }: FollowPayload): AlertView => ({
  kind: 'follow',
  paper: 'bg-paper-red',
  label: 'new follower',
  title: username,
  detail: 'welcome to the sphere',
  sound: ALERT_SOUNDS.follow,
  durationMs: ALERT_DURATION_MS,
});

export const raidAlert = ({ raiderName, viewers }: RaidPayload): AlertView => ({
  kind: 'raid',
  paper: 'bg-paper-cyan',
  label: 'raid incoming',
  title: raiderName,
  detail: 'welcome to the sphere',
  chips: [`${viewers} ${plural(viewers, 'viewer')}`],
  sound: ALERT_SOUNDS.raid,
  durationMs: ALERT_DURATION_MS,
});

export const rewardAlert = ({ username, rewardTitle }: RewardRedeemPayload): AlertView => ({
  kind: 'reward',
  paper: 'bg-paper-purple',
  label: 'reward redeemed',
  title: username,
  chips: [rewardTitle],
  sound: ALERT_SOUNDS.reward,
  durationMs: ALERT_DURATION_MS,
});

export const chestAlert = ({ username, coinAmount, lang }: FishingChestPayload): AlertView => {
  const texts = MESSAGES[lang].chestAlert;
  return {
    kind: 'chest',
    paper: 'bg-paper-amber',
    label: texts.label,
    title: username,
    detail: texts.toBank(coinAmount),
    sound: ALERT_SOUNDS.chest,
    soundDelayMs: CHEST_SOUND_DELAY_MS,
    durationMs: CHEST_ALERT_DURATION_MS,
  };
};

export const goldenBeerAlert = ({ username, goldenBeers, tier, isNewTier }: GoldenBeerPayload): AlertView => {
  const tierLabel = goldenBeerTierLabel(tier);
  return {
    kind: 'beer',
    paper: 'bg-paper-amber',
    label: 'golden beer',
    title: username,
    detail: `${tierLabel} brew`,
    stat: { value: `x${goldenBeers}`, unit: plural(goldenBeers, 'beer') },
    media: { src: goldenBeerArtPath(tier), alt: `Golden beer achievement: ${tierLabel} tier` },
    tag: isNewTier ? 'new tier' : undefined,
    sound: ALERT_SOUNDS.beer,
    durationMs: BEER_ALERT_DURATION_MS,
  };
};

// «vip unlocked»: розовая бумага, 5 с, add-vip.mp3 и тексты — как в старом проекте
export const addVipAlert = ({ username }: AddVipPayload): AlertView => ({
  kind: 'vip',
  paper: 'bg-paper-rose',
  label: 'vip unlocked',
  title: username,
  detail: 'elite presence activated',
  sound: ALERT_SOUNDS.vip,
  durationMs: ALERT_DURATION_MS,
});

// Билет лотереи: «earned a Lottery Ticket» из старого проекта. Бумага cyan: у лотереи своего цвета нет,
// а mint — главный акцент сцены розыгрыша
export const lotteryTicketAlert = ({ username, lang }: LotteryTicketPayload): AlertView => {
  const texts = MESSAGES[lang].lotteryScene;
  return {
    kind: 'ticket',
    paper: 'bg-paper-cyan',
    label: texts.ticketLabel,
    title: username,
    detail: texts.ticketDetail,
    sound: ALERT_SOUNDS.ticket,
    durationMs: ALERT_DURATION_MS,
  };
};

// Bits: синяя бумага, число битсов справа. Тексты английские, как у follow и raid
export const bitsAlert = ({ username, bits }: BitsPayload): AlertView => ({
  kind: 'bits',
  paper: 'bg-paper-blue',
  label: 'bits cheered',
  title: username ?? 'Anonymous',
  stat: { value: String(bits), unit: plural(bits, 'bit') },
  sound: ALERT_SOUNDS.bits,
  durationMs: ALERT_DURATION_MS,
});

// Арт рубежа: streak-N.webp берётся по ближайшему порогу каталога достижений не выше стрика
// (25 стримов → streak-20). Меньше первого порога стрика не бывает: награда начинается с 3.
const watchStreakArt = (streak: number): string | null => {
  const category = findCategory('watch-streak');
  if (!category) return null;
  const level = achievementLevel(category.thresholds, streak);
  return level > 0 ? achievementArtPath(category, level) : null;
};

// Watch streak: синяя бумага, `x{N}` в плитке, метка «new», пока рубеж не повторный; арт — как у ачивки
export const watchStreakAlert = ({ username, streakValue, xpAwarded, coinsAwarded, isRepeat }: WatchStreakPayload): AlertView => {
  const art = watchStreakArt(streakValue);
  const chips = [
    ...(xpAwarded > 0 ? [`+${xpAwarded} XP`] : []),
    ...(coinsAwarded > 0 ? [`+${coinsAwarded} coins`] : []),
  ];
  return {
    kind: 'streak',
    paper: 'bg-paper-blue',
    label: 'stream streak',
    title: username,
    detail: streakFlavor(streakValue),
    stat: { value: `x${streakValue}`, unit: 'streams' },
    chips: chips.length > 0 ? chips : undefined,
    media: art ? { src: art, alt: `Watch streak achievement: ${streakValue} streams in a row` } : undefined,
    tag: isRepeat ? undefined : 'new',
    sound: ALERT_SOUNDS.streak,
    durationMs: STREAK_ALERT_DURATION_MS,
  };
};

// Подпись под ником, как в старом TwitchWatchStreak.vue
const streakFlavor = (streak: number): string => {
  if (streak === 3) return 'the fire ignites';
  if (streak === 5) return 'streak machine';
  if (streak === 7) return 'unstoppable';
  if (streak % 10 === 0) return 'a jubilee run';
  if (streak % 5 === 0) return 'a round number';
  return 'streams in a row';
};

// Новый уровень зрителя: своя карточка в духе мини-профиля (LevelUpCard), не на старом неоне (DESIGN.md, 4.8).
// Она крупнее обычной наклейки: на 44-пиксельной пластине героя не разглядеть. Висит дольше обычного.
export const levelUpAlert = (payload: UserLevelUpPayload): AlertView => ({
  kind: 'levelup',
  paper: 'bg-paper-cyan',
  label: 'level up',
  title: payload.username,
  levelUp: payload,
  sound: ALERT_SOUNDS.levelup,
  durationMs: LEVEL_UP_ALERT_DURATION_MS,
});

// Новый уровень героя: компактная наклейка с портретом героя (HeroLevelUpCard)
export const heroLevelUpAlert = (payload: HeroLevelUpPayload): AlertView => ({
  kind: 'herolevelup',
  paper: 'bg-paper-cyan',
  label: 'hero level up',
  title: payload.username,
  heroLevelUp: payload,
  sound: ALERT_SOUNDS.herolevelup,
  durationMs: HERO_LEVEL_UP_ALERT_DURATION_MS,
});

export const subAlert = (sub: SubPayload): AlertView => {
  const common = {
    kind: 'sub',
    paper: 'bg-paper-rose',
    sound: ALERT_SOUNDS.sub,
    durationMs: ALERT_DURATION_MS,
  } as const;

  switch (sub.kind) {
    case 'new':
      return {
        ...common,
        label: withTier('new subscriber', sub.tier),
        title: sub.username,
        detail: 'welcome to the sphere',
      };
    case 'resub':
      return {
        ...common,
        label: withTier('resubscribed', sub.tier),
        title: sub.username,
        detail: 'welcome back to the sphere',
        stat: { value: String(sub.months), unit: plural(sub.months, 'month') },
      };
    case 'gift':
      return {
        ...common,
        label: withTier('gift subs', sub.tier),
        title: sub.username ?? 'anonymous',
        detail: 'gifted to the sphere',
        stat: { value: `x${sub.amount}`, unit: plural(sub.amount, 'sub') },
      };
  }
};
