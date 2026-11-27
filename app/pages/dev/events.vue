<script setup lang="ts">
// Эмулятор событий без Twitch: кнопки шлют dev-события на сервер бота, он рассылает их оверлеям
// как настоящие. Справа — превью оверлеев. Нужен запущенный бот (pnpm dev) и DEV_EVENTS != false.
import type {
  ChatAnnounceColor,
  ChatMessagePayload,
  MusicNowPlayingPayload,
  SubPayload,
  SubTier,
} from '#shared/events';
import {
  FISH_CATCHES,
  FISH_CATCH_IDS,
  FISH_CATCH_WEIGHTS,
  FISH_MESSAGE_VARIANTS,
  FISH_TOTAL_WEIGHT,
  fishCatchMessage,
  pickCatch,
  type FishCatchId,
} from '#shared/fishing';
import { BOT_LANG, LANGS, MESSAGES, type Lang } from '#shared/i18n';
import {
  LOTTERY_CONFIG,
  LOTTERY_ENTRIES_MAX,
  LOTTERY_LIST_MIN,
  LOTTERY_SCENE_MS,
} from '#shared/lottery';
import {
  PIVO_MESSAGE_VARIANTS,
  PIVO_OUTCOME_WEIGHTS,
  PIVO_TIER_THRESHOLDS,
  getGoldenBeerTier,
  goldenBeerTierLabel,
  pickPivoOutcome,
} from '#shared/pivo';
import {
  JACKPOT_SEED,
  JACKPOT_SHARE,
  ROULETTE_PRIZES,
  ROULETTE_SEGMENT_IDS,
  type RouletteSegmentId,
} from '#shared/roulette';
import { DEFAULT_HERO_ID, HEROES } from '#shared/heroes';
import { TIMER_COLORS, type TimerColor } from '#shared/events';
import { COIN_EXCHANGE_PACKAGES, watchStreakReward } from '#shared/economy';
import { buildStreamState, getLevelRange, getStreamLevel } from '#shared/xp';
import type { ProfileShowPayload, ShopShowPayload } from '#shared/events';
import { PROFILE_SAMPLE, PROFILE_SPARSE } from '~/utils/profileSample';
import { segmentView } from '~/utils/roulette/rarity';

const { $socket } = useNuxtApp();
const app = useAppStore();
const stream = useStreamStore();
const bank = useBankStore();
const roulette = useRouletteStore();
const lottery = useLotteryStore();

// Что показывать в превью справа: слои снизу вверх. «Сцена» — все оверлеи друг на друге, как в OBS,
// но одной страницей: каждая страница в dev держит долгое соединение, а у Chrome лимит 6 на адрес
const previews = [
  { label: 'Сцена', paths: ['/overlay/scene'] },
  { label: 'Шапка', paths: ['/overlay/stream'] },
  { label: 'Рулетка', paths: ['/overlay/roulette'] },
  { label: 'Лотерея', paths: ['/overlay/lottery'] },
  { label: 'Герои', paths: ['/overlay/heroes'] },
  { label: 'Профиль', paths: ['/overlay/profile'] },
  { label: 'Лидерборд', paths: ['/overlay/leaderboard'] },
  { label: 'Магазин', paths: ['/overlay/shop'] },
  { label: 'Чат', paths: ['/overlay/chat'] },
  { label: 'Музыка', paths: ['/overlay/music'] },
  { label: 'Алерты', paths: ['/overlay/alerts'] },
  { label: 'Таймер', paths: ['/overlay/timer'] },
] as const;
const preview = shallowRef<(typeof previews)[number]>(previews[0]);

const username = ref('TestViewer');
const status = ref('');

// Левая часть — табы по разделам; сцена справа от выбора таба не зависит. Выбор помнится в localStorage
const tabs = [
  { id: 'stream', label: 'Стрим' },
  { id: 'timer', label: 'Таймер' },
  { id: 'chat', label: 'Чат' },
  { id: 'alerts', label: 'Алерты' },
  { id: 'roulette', label: 'Рулетка' },
  { id: 'fishing', label: 'Рыбалка' },
  { id: 'pivo', label: 'Пиво' },
  { id: 'vip', label: 'VIP' },
  { id: 'profile', label: 'Профиль' },
  { id: 'leaderboard', label: 'Лидерборд' },
  { id: 'shop', label: 'Магазин' },
  { id: 'lottery', label: 'Лотерея' },
  { id: 'music', label: 'Музыка' },
] as const;
type TabId = (typeof tabs)[number]['id'];
const TAB_KEY = 'dev-events-tab';
const tab = ref<TabId>('stream');
const selectTab = (id: TabId) => {
  tab.value = id;
  try {
    localStorage.setItem(TAB_KEY, id);
  } catch {
    // localStorage недоступен — просто не запоминаем
  }
};
onMounted(() => {
  try {
    const saved = localStorage.getItem(TAB_KEY);
    if (tabs.some((item) => item.id === saved)) tab.value = saved as TabId;
  } catch {
    // нет доступа к localStorage — остаёмся на первом табе
  }
});

type DevEvent =
  | 'dev:chat-message'
  | 'dev:hero-changed'
  | 'dev:profile'
  | 'dev:shop'
  | 'dev:leaderboard'
  | 'dev:stream-state'
  | 'dev:xp-boost'
  | 'dev:timer'
  | 'dev:follow'
  | 'dev:raid'
  | 'dev:reward-redeem'
  | 'dev:sub'
  | 'dev:bits'
  | 'dev:watch-streak'
  | 'dev:fishing-chest'
  | 'dev:golden-beer'
  | 'dev:add-vip'
  | 'dev:lottery-draw'
  | 'dev:lottery-participants'
  | 'dev:lottery-ticket'
  | 'dev:music'
  | 'dev:roulette-spin'
  | 'dev:jackpot';

// Музыка. Обложка рисуется на лету (SVG в data URL), чтобы кнопки работали без файлов и без плеера
const demoArtwork = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128"><rect width="128" height="128" fill="#e08aa4"/><circle cx="64" cy="64" r="34" fill="#8fc9b8"/><circle cx="64" cy="64" r="8" fill="#2b2630"/></svg>',
)}`;

const sendMusic = (patch: Partial<MusicNowPlayingPayload> | null) => {
  send(
    'dev:music',
    patch && {
      title: 'Black Friday (pretty like the sun)',
      artist: 'Lost Frequencies, Tom Odell',
      album: null,
      artwork: demoArtwork,
      durationMs: 205_000,
      positionMs: 62_000,
      isPlaying: true,
      sentAt: Date.now(),
      ...patch,
    },
  );
};

const send = (event: DevEvent, payload: unknown) => {
  $socket.emit(event, payload, (result) => {
    status.value = result.ok ? 'отправлено' : `отклонено: ${result.reason ?? '?'}`;
  });
};

// --- Стрим -----------------------------------------------------------------------------
// Считаем от того, что сейчас показывает шапка. В базу ничего не пишется.
const streamAmount = ref(500);

const sendStreamXp = (totalXp: number, lvl: number) =>
  send('dev:stream-state', buildStreamState(getStreamLevel(lvl, totalXp), totalXp));

const addStreamXp = () => {
  if (stream.state) sendStreamXp(stream.state.newXp + streamAmount.value, stream.state.lvl);
};

// Добавляет ровно столько, сколько не хватает до следующего уровня
const streamLevelUp = () => {
  if (stream.state) sendStreamXp(stream.state.maxXp, stream.state.lvl);
};

const resetStream = () => {
  $socket.emit('dev:stream-reset', (result) => {
    status.value = result.ok ? 'отправлено' : `отклонено: ${result.reason ?? '?'}`;
  });
};

// --- Буст XP ---------------------------------------------------------------------------
// Показывает чип на оверлее; в базу и в XP зрителей ничего не пишется
const boostMinutes = ref(30);
const boostMultiplier = ref(2);

const sendBoost = (seconds: number) =>
  send('dev:xp-boost', { multiplier: boostMultiplier.value, expiresAt: Date.now() + seconds * 1000 });
const removeBoost = () => send('dev:xp-boost', null);
const resetBoost = () => {
  $socket.emit('dev:xp-boost-reset', (result) => {
    status.value = result.ok ? 'отправлено' : `отклонено: ${result.reason ?? '?'}`;
  });
};

// --- Таймер ----------------------------------------------------------------------------
// Как `!timer`: показывается на оверлее, в базу не пишется. Короткий запуск — проверить конец и звук
const timerMinutes = ref(5);
const timerColor = ref<TimerColor>('blue');
const timerTitle = ref('Скоро вернусь');

const sendTimer = (seconds: number) =>
  send('dev:timer', {
    title: timerTitle.value.trim() || 'Timer',
    color: timerColor.value,
    endsAt: Date.now() + seconds * 1000,
  });
const stopTimer = () => {
  $socket.emit('dev:timer-stop', (result) => {
    status.value = result.ok ? 'отправлено' : `отклонено: ${result.reason ?? '?'}`;
  });
};
const resetTimer = () => {
  $socket.emit('dev:timer-reset', (result) => {
    status.value = result.ok ? 'отправлено' : `отклонено: ${result.reason ?? '?'}`;
  });
};

// --- Чат -------------------------------------------------------------------------------
const chatText = ref('Привет, чат! Kappa');
const chatColor = ref('#ff7ab8');
const chatLvl = ref(12);
const chatRoles = reactive({
  isBroadcaster: false,
  isBot: false,
  isMod: false,
  isVip: false,
  isPermanentVip: false,
  isSubscriber: false,
  isFollower: false,
  isHighlight: false,
  isAction: false,
});
const chatRoleLabels: Record<keyof typeof chatRoles, string> = {
  isBroadcaster: 'стример',
  isBot: 'бот',
  isMod: 'модератор',
  isVip: 'VIP (бейдж Twitch)',
  isPermanentVip: 'VIP из базы (!addvip)',
  isSubscriber: 'саб',
  isFollower: 'фолловер',
  isHighlight: 'highlight',
  isAction: '/me',
};
const chatAnnounce = ref<ChatAnnounceColor | ''>('');
const chatStreak = ref(false);
const chatHero = ref(DEFAULT_HERO_ID);

let chatSeq = 0;
const chatMessage = (over: Partial<ChatMessagePayload> = {}): ChatMessagePayload => ({
  id: `dev-chat-${Date.now()}-${chatSeq++}`,
  userId: `dev-${username.value.toLowerCase()}`,
  username: username.value.toLowerCase(),
  displayName: username.value,
  color: chatColor.value,
  text: chatText.value,
  badges: [],
  // Смайл Kappa (id 25) на месте первого слова «Kappa», если оно есть в тексте
  emotes: emotesFor(chatText.value),
  timestamp: Date.now(),
  userLvl: chatLvl.value,
  isMod: chatRoles.isMod,
  isFollower: chatRoles.isFollower,
  isFounder: false,
  isSubscriber: chatRoles.isSubscriber,
  isVip: chatRoles.isVip,
  isPermanentVip: chatRoles.isPermanentVip,
  isBroadcaster: chatRoles.isBroadcaster,
  isBot: chatRoles.isBot,
  isHighlight: chatRoles.isHighlight,
  isAction: chatRoles.isAction,
  ...(chatAnnounce.value ? { isAnnouncement: true, announceColor: chatAnnounce.value } : {}),
  ...(chatStreak.value ? { watchStreak: { value: 5, reward: 500 } } : {}),
  hero: { heroId: chatHero.value },
  ...over,
});

const emotesFor = (text: string): Record<string, string[]> => {
  const emotes: Record<string, string[]> = {};
  for (const [name, id] of [['Kappa', '25'], ['LUL', '425618'], ['PogChamp', '305954156']] as const) {
    for (const match of text.matchAll(new RegExp(`\\b${name}\\b`, 'g'))) {
      const start = match.index ?? 0;
      (emotes[id] ??= []).push(`${start}-${start + name.length - 1}`);
    }
  }
  return emotes;
};

const sendChat = () => send('dev:chat-message', chatMessage());

// Как `!use` в чате: зритель уже на полосе, спрайт меняется сразу, без нового сообщения
const changeHero = () => send('dev:hero-changed', { userId: `dev-${username.value.toLowerCase()}`, heroId: chatHero.value });

// По одному сообщению от каждой роли: видно рамку, медаль и плашку каждого типа
const ROLE_SAMPLES: [string, number, Partial<ChatMessagePayload>][] = [
  ['Streamer', 100, { isBroadcaster: true }],
  ['SysBot', 1, { isBot: true }],
  ['ModMike', 45, { isMod: true }],
  ['VipVera', 33, { isVip: true }],
  ['PermVipPit', 28, { isPermanentVip: true }],
  ['SubSam', 22, { isSubscriber: true }],
  ['FollowFin', 8, { isFollower: true }],
  ['Viewer', 2, {}],
];
const chatRolesBurst = (highlight = false) => {
  ROLE_SAMPLES.forEach(([name, lvl, flags], index) => {
    setTimeout(() => {
      send(
        'dev:chat-message',
        chatMessage({
          id: `dev-chat-${Date.now()}-${chatSeq++}`,
          userId: `dev-${name.toLowerCase()}`,
          username: name.toLowerCase(),
          displayName: name,
          userLvl: lvl,
          text: `Сообщение роли ${name} Kappa`,
          // Герои по кругу: на полосе видно все три спрайта сразу
          hero: { heroId: HEROES[index % HEROES.length]!.id },
          emotes: emotesFor(`Сообщение роли ${name} Kappa`),
          isMod: false,
          isVip: false,
          isPermanentVip: false,
          isSubscriber: false,
          isFollower: false,
          isBroadcaster: false,
          isBot: false,
          isHighlight: highlight === true,
          ...flags,
        }),
      );
    }, index * 500);
  });
};

// Семь подряд: проверка лимита в 5 сообщений и ухода старых вниз
const chatSpam = () => {
  for (let i = 1; i <= 7; i++) {
    setTimeout(() => send('dev:chat-message', chatMessage({ text: `Сообщение №${i} LUL`, emotes: emotesFor(`Сообщение №${i} LUL`) })), i * 300);
  }
};

const chatLongLink = () =>
  send(
    'dev:chat-message',
    chatMessage({ text: 'Смотрите https://github.com/LuckyFoxCode/fox-sphere-nuxt, очень_длинное_слово_без_пробелов_чтобы_проверить_перенос_строки' , emotes: {} }),
  );

// --- Алерты ----------------------------------------------------------------------------
const raidViewers = ref(42);
const rewardTitle = ref('Check My Stats');
const subTier = ref<SubTier>('1000');
const subMonths = ref(6);
const giftAmount = ref(5);
const bitsAmount = ref(100);
const streakValue = ref(7);

const alertUser = () => ({ userId: `dev-${username.value.toLowerCase()}`, username: username.value });

const follow = () => send('dev:follow', alertUser());
const raid = () =>
  send('dev:raid', {
    raiderId: `dev-${username.value.toLowerCase()}`,
    raiderName: username.value,
    viewers: raidViewers.value,
  });
const reward = () =>
  send('dev:reward-redeem', {
    ...alertUser(),
    rewardTitle: rewardTitle.value,
    redemptionId: `dev-redemption-${Date.now()}`,
  });
const sendSub = (payload: SubPayload) => send('dev:sub', payload);
const subNew = () => sendSub({ kind: 'new', ...alertUser(), tier: subTier.value });
const resub = () => sendSub({ kind: 'resub', ...alertUser(), tier: subTier.value, months: subMonths.value });
const sendBits = (name: string | null) => send('dev:bits', { username: name, bits: bitsAmount.value });
// Watch streak: алерт с теми же полями, что шлёт бот; награда считается по тем же правилам (shared/economy.ts)
const watchStreakAlert = (isRepeat = false, streak = streakValue.value) => {
  const { xp, coins } = watchStreakReward(streak, isRepeat);
  send('dev:watch-streak', {
    ...alertUser(),
    streakValue: streak,
    xpAwarded: xp,
    coinsAwarded: coins,
    isRepeat,
  });
};
// Плашка стрика в чате: сообщение с полем watchStreak, как при USERNOTICE от Twitch
const watchStreakChat = (streak = streakValue.value) =>
  send(
    'dev:chat-message',
    chatMessage({ text: 'Дошёл до рубежа!', watchStreak: { value: streak, reward: streak * 50 } }),
  );
const watchStreakBoth = () => {
  watchStreakChat();
  watchStreakAlert();
};
const giftSubs = (gifter: string | null) =>
  sendSub({ kind: 'gift', username: gifter, tier: subTier.value, amount: giftAmount.value });

// --- Сундук из рыбалки -----------------------------------------------------------------
// Как настоящий улов: алерт и монеты в банк шапки. Пока крутится лента, банк ждёт её остановки.
const CHEST_COINS = FISH_CATCHES.bank200.bankAmount;
// Монеты сундуков, пойманных во время вращения
let heldChestCoins = 0;

const addToBank = (amount: number) => send('dev:jackpot', { jackpotTotal: (bank.total ?? JACKPOT_SEED) + amount });

const topUpBank = (amount: number) => {
  if (!roulette.current || roulette.phase !== 'spinning') return addToBank(amount);
  // Первый сундук за это вращение ждёт банк от остановки ленты, остальные прибавляются к нему
  if (heldChestCoins === 0) {
    $socket.once('stream:jackpot-updated', () => {
      const held = heldChestCoins;
      heldChestCoins = 0;
      addToBank(held);
    });
  }
  heldChestCoins += amount;
};

const chest = (name = username.value, lang: Lang = fishLang.value) => {
  topUpBank(CHEST_COINS);
  send('dev:fishing-chest', { userId: `dev-${name.toLowerCase()}`, username: name, coinAmount: CHEST_COINS, lang });
};

// Все сразу: на оверлее они должны идти по одному
const allAlerts = () => {
  follow();
  raid();
  reward();
  subNew();
  resub();
  giftSubs(username.value);
  sendBits(username.value);
  watchStreakAlert();
  chest();
  goldenBeer();
  vipUnlocked();
};

// --- Рулетка и банк --------------------------------------------------------------------
// Выплата и банк считаются от того, что показывает шапка, по тем же правилам, что в боте. База не меняется.
const spinSegment = ref<RouletteSegmentId>('coins250');
const bankInput = ref(11540);
// Банк после уже отправленных, но ещё не доигранных вращений: очередь не должна считать от старого
let pendingBank: number | null = null;
watch(
  () => bank.total,
  (total) => {
    if (total === pendingBank) pendingBank = null;
  },
);

const spinLabel = (id: RouletteSegmentId) => {
  const view = segmentView(id);
  return `${view.value === '—' ? '' : `${view.value} `}${view.unit} (${view.style.label})`;
};

const spin = (segment: RouletteSegmentId, name = username.value) => {
  const prize = ROULETTE_PRIZES[segment];
  const jackpotWon = segment === 'jackpot';
  const after = (pendingBank ?? bank.total ?? JACKPOT_SEED) + JACKPOT_SHARE;
  pendingBank = jackpotWon ? JACKPOT_SEED : after;
  send('dev:roulette-spin', {
    userId: `dev-${name.toLowerCase()}`,
    username: name,
    ...prize,
    coinAmount: jackpotWon ? after : prize.coinAmount,
    jackpotWon,
    jackpotTotalAfter: pendingBank,
  });
};

const spinRandom = () =>
  spin(ROULETTE_SEGMENT_IDS[Math.floor(Math.random() * ROULETTE_SEGMENT_IDS.length)] ?? 'empty');

// Три подряд: на оверлее они должны идти по одному
const spinQueue = () => {
  spin('empty', 'Fox');
  spin('coins500', 'Lynx');
  spin('xp100', 'Wolf');
};

const setBank = (jackpotTotal: number) => {
  pendingBank = null;
  send('dev:jackpot', { jackpotTotal });
};

const resetBank = () => {
  pendingBank = null;
  $socket.emit('dev:jackpot-reset', (result) => {
    status.value = result.ok ? 'отправлено' : `отклонено: ${result.reason ?? '?'}`;
  });
};

// --- Рыбалка ---------------------------------------------------------------------------
// Своего оверлея у рыбалки нет: ответы бота видны в чате оверлея, сундук — в алертах и банке
// шапки, XP — в XP стрима. База не меняется; поклёвка здесь через 3 с вместо 10–30.
const FISH_DEV_BITE_MS = 3000;
const fishPick = ref<FishCatchId>('bank200');
// Язык ответов бота в эмуляции; у настоящего бота — BOT_LANG
const fishLang = ref<Lang>(BOT_LANG);
const fishTexts = computed(() => MESSAGES[fishLang.value].fish);

const fishLabel = (id: FishCatchId) => {
  const { catchType, coinAmount, xpAmount, bankAmount } = FISH_CATCHES[id];
  const name = {
    empty: 'Сорвалась',
    coins: `+${coinAmount} монет`,
    xp: `+${xpAmount} XP`,
    bank: `Сундук: ${bankAmount} в банк`,
  }[catchType];
  const chance = (FISH_CATCH_WEIGHTS[id] / FISH_TOTAL_WEIGHT) * 100;
  return `${name} (${chance.toLocaleString('ru-RU')}%)`;
};

const botSay = (text: string) =>
  send(
    'dev:chat-message',
    chatMessage({
      userId: 'dev-bot',
      username: 'sysbot',
      displayName: 'SysBot',
      color: '#94A3B8',
      text,
      emotes: {},
      userLvl: 1,
      isMod: false,
      isVip: false,
      isSubscriber: false,
      isFollower: false,
      isBroadcaster: false,
      isBot: true,
      isHighlight: false,
      isAction: false,
      isAnnouncement: false,
      announceColor: undefined,
      watchStreak: undefined,
    }),
  );

const fish = (id: FishCatchId, name = username.value) => {
  // Ответы и алерт одного заброса — на одном языке, даже если его переключили во время ожидания
  const lang = fishLang.value;
  const texts = MESSAGES[lang].fish;
  botSay(texts.cast(name));
  setTimeout(() => {
    const caught = FISH_CATCHES[id];
    if (caught.catchType === 'bank') chest(name, lang);
    if (caught.xpAmount > 0 && stream.state) sendStreamXp(stream.state.newXp + caught.xpAmount, stream.state.lvl);
    botSay(fishCatchMessage(texts, caught, name, Math.floor(Math.random() * FISH_MESSAGE_VARIANTS)));
  }, FISH_DEV_BITE_MS);
};

const fishRandom = () => fish(pickCatch((max) => Math.floor(Math.random() * max)));

// --- Пиво ------------------------------------------------------------------------------
// Своего оверлея у !pivo нет: фраза видна в чате, золото — алертом (amber, арт ступени, 7 с).
// База не меняется: счётчик золотого пива берётся из поля ниже, а не из базы.
const pivoLang = ref<Lang>(BOT_LANG);
const pivoTexts = computed(() => MESSAGES[pivoLang.value].pivo);
const pivoCount = ref<number>(PIVO_TIER_THRESHOLDS[0]);
const pivoGoldenChance = (PIVO_OUTCOME_WEIGHTS.golden / (PIVO_OUTCOME_WEIGHTS.regular + PIVO_OUTCOME_WEIGHTS.golden)) * 100;

// Показ золотого пива: алерт с теми же полями, что шлёт бот. Ступень и «new tier» считаются
// по счётчику так же, как в боте (shared/pivo.ts)
const goldenBeer = (name = username.value, count = pivoCount.value) => {
  const tier = getGoldenBeerTier(count);
  send('dev:golden-beer', {
    userId: `dev-${name.toLowerCase()}`,
    username: name,
    goldenBeers: count,
    tier,
    isNewTier: tier > getGoldenBeerTier(count - 1),
  });
};

const pivoRegular = (name = username.value, variant = Math.floor(Math.random() * PIVO_MESSAGE_VARIANTS)) =>
  botSay(pivoTexts.value.regular[variant]!(name));

const pivoGolden = (name = username.value, count = pivoCount.value) => {
  botSay(pivoTexts.value.golden(name));
  goldenBeer(name, count);
};

const pivoRoll = () =>
  pickPivoOutcome((max) => Math.floor(Math.random() * max)) === 'golden' ? pivoGolden() : pivoRegular();

// --- VIP -------------------------------------------------------------------------------
// !addvip / !removevip: фраза бота — в «Чате», алерт «vip unlocked» — в «Алертах» (5 с, add-vip.mp3).
// База и Twitch не меняются. Права: стример или модератор; ник цели — из поля ниже.
const vipLang = ref<Lang>(BOT_LANG);
const vipTexts = computed(() => MESSAGES[vipLang.value].vip);
const vipModerator = ref('ModMike');
const vipTarget = ref('VipVera');
const vipPrefix = '!';

const vipUnlocked = (name = vipTarget.value) =>
  send('dev:add-vip', { userId: `dev-${name.toLowerCase()}`, username: name });

const vipAdd = () => {
  botSay(vipTexts.value.added(vipModerator.value, vipTarget.value));
  vipUnlocked();
};
const vipRemove = () => botSay(vipTexts.value.removed(vipModerator.value, vipTarget.value));

// --- Магазин ---------------------------------------------------------------------------
// Награда «Flex Leaderboard»: топ-5 на оверлее на 9 секунд. Данные примера, в базу ничего не пишется.
const BOARD_TOP = [
  { rank: 1, userId: 'dev-1', username: 'FoxMaster', lvl: 42, xp: 128_400 },
  { rank: 2, userId: 'dev-2', username: 'Beerbaron', lvl: 37, xp: 96_150 },
  { rank: 3, userId: 'dev-3', username: 'night_owl', lvl: 31, xp: 71_020 },
  { rank: 4, userId: 'dev-4', username: 'Pixelka', lvl: 28, xp: 55_300 },
  { rank: 5, userId: 'dev-5', username: 'mr_coin', lvl: 25, xp: 43_870 },
];
const leaderboardShow = (inTop: boolean) =>
  send('dev:leaderboard', {
    requesterId: inTop ? 'dev-3' : 'dev-77',
    requesterName: inTop ? 'night_owl' : 'LuckyViewer',
    entries: BOARD_TOP,
    you: inTop ? null : { rank: 18, userId: 'dev-77', username: 'LuckyViewer', lvl: 9, xp: 2_340 },
  });

// !shop: окно героев на оверлее на 12 секунд (в чат ничего не пишет). Баланс, купленные и надетый герой — из полей.
// Ждёт, пока на сцене рулетка или лотерея. База не меняется.
const shopCoins = ref(500);
const shopOwned = reactive<Record<string, boolean>>(Object.fromEntries(HEROES.map((hero) => [hero.id, hero.price === 0])));
const shopActiveId = ref<string>(DEFAULT_HERO_ID);

const shopFromForm = (): ShopShowPayload => {
  const ownedHeroIds = HEROES.filter((hero) => shopOwned[hero.id]).map((hero) => hero.id);
  return {
    userId: `dev-${username.value.toLowerCase()}`,
    displayName: username.value,
    coins: shopCoins.value,
    ownedHeroIds,
    activeHeroId: ownedHeroIds.includes(shopActiveId.value) ? shopActiveId.value : (ownedHeroIds[0] ?? null),
    prefix: vipPrefix,
  };
};
const shopShow = (patch: Partial<ShopShowPayload> = {}) => send('dev:shop', { ...shopFromForm(), ...patch });

// --- Профиль ---------------------------------------------------------------------------
// !profile: карточка на оверлее на 9 секунд (в чат ничего не пишет). Ник, цвет, герой и роли — из полей ниже;
// титул и цвета карточки считаются как в чате. Ждёт, пока на сцене рулетка или лотерея. База не меняется.
const profileLvl = ref(14);
const profileXpPercent = ref(60);
const profileHeroId = ref<string>(DEFAULT_HERO_ID);
const profileNoHero = ref(false);
const profileHeroLevel = ref(7);
const profileCoins = ref(4180);
const profileRoles = reactive({
  isBroadcaster: false,
  isMod: false,
  isFounder: false,
  isSubscriber: true,
  isVip: false,
  isPermanentVip: false,
  isLuckyVip: false,
  isFollower: true,
});
const profileRoleLabels: Record<keyof typeof profileRoles, string> = {
  isBroadcaster: 'стример',
  isMod: 'модератор',
  isFounder: 'founder',
  isSubscriber: 'саб',
  isVip: 'VIP (бейдж Twitch)',
  isPermanentVip: 'VIP из базы',
  isLuckyVip: 'lucky VIP (лотерея)',
  isFollower: 'фолловер',
};

const profileFromForm = (): ProfileShowPayload => {
  const { startXp, maxXp } = getLevelRange(profileLvl.value);
  return {
    ...PROFILE_SAMPLE,
    userId: `dev-${username.value.toLowerCase()}`,
    username: username.value.toLowerCase(),
    displayName: username.value,
    color: chatColor.value,
    lvl: profileLvl.value,
    startXp,
    maxXp,
    xp: Math.round(startXp + ((maxXp - startXp) * profileXpPercent.value) / 100),
    coins: profileCoins.value,
    heroId: profileNoHero.value ? null : profileHeroId.value,
    heroLevel: profileNoHero.value ? null : profileHeroLevel.value,
    ...profileRoles,
  };
};
const profileShow = (payload: ProfileShowPayload = profileFromForm()) => send('dev:profile', payload);
// По карточке на каждую роль подряд: проверка цвета и титула. Очередь бота держит до 10 карточек
const PROFILE_ROLE_SAMPLES: [string, number, Partial<typeof profileRoles>][] = [
  ['Streamer', 100, { isBroadcaster: true }],
  ['ModMike', 45, { isMod: true }],
  ['VipVera', 33, { isVip: true }],
  ['PermVipPit', 28, { isPermanentVip: true }],
  ['SubSam', 22, { isSubscriber: true }],
  ['FollowFin', 8, { isFollower: true }],
  ['Viewer', 2, {}],
];
const profileRolesBurst = () => {
  const none = { isBroadcaster: false, isMod: false, isFounder: false, isSubscriber: false, isVip: false, isPermanentVip: false, isLuckyVip: false, isFollower: false };
  PROFILE_ROLE_SAMPLES.forEach(([name, lvl, flags], index) => {
    const { startXp, maxXp } = getLevelRange(lvl);
    setTimeout(
      () =>
        profileShow({
          ...PROFILE_SAMPLE,
          ...none,
          ...flags,
          userId: `dev-${name.toLowerCase()}`,
          username: name.toLowerCase(),
          displayName: name,
          lvl,
          startXp,
          maxXp,
          xp: Math.round(startXp + (maxXp - startXp) * 0.4),
          heroId: HEROES[index % HEROES.length]!.id,
        }),
      index * 150,
    );
  });
};

// --- Лотерея ---------------------------------------------------------------------------
// !ticket, !tickets, !runlottery: сцена розыгрыша — в «Лотерее» и «Сцене», билет — алертом в «Алертах», фразы
// бота — в «Чате». Сцена всегда идёт 15 секунд, сколько бы ни было участников: кнопки ниже гонят
// разные числа, а справа от них виден замер. База и Twitch не меняются, сцена встаёт в очередь бота
// после рулетки, как настоящая.
const lotteryLang = ref<Lang>(BOT_LANG);
const lotteryTexts = computed(() => MESSAGES[lotteryLang.value].lottery);
const lotteryReturning = ref(1);
const lotteryChat = ref(true);
const LOTTERY_SIZES = [1, 3, 5, 8, 25, LOTTERY_ENTRIES_MAX, 600] as const;

const LOTTERY_NAME_A = ['Fox', 'Lynx', 'Wolf', 'Bear', 'Owl', 'Hawk', 'Otter', 'Raven', 'Panda', 'Tiger', 'Moose', 'Koala'];
const LOTTERY_NAME_B = ['Pixel', 'Storm', 'Byte', 'Cloud', 'Rune', 'Ember', 'Frost', 'Nova', 'Echo', 'Blaze', 'Dash', 'Mint'];
// Ники Twitch до 25 символов: длинные проверяют обрезку в барабане и в списке
const LOTTERY_LONG_NAMES = ['The_Longest_Twitch_Name_1', 'xX_ShadowFoxSlayer_Xx', 'ВеликийЛисЗаПроектом'];

const lotteryName = (index: number) =>
  index < LOTTERY_LONG_NAMES.length
    ? LOTTERY_LONG_NAMES[index]!
    : `${LOTTERY_NAME_A[index % 12]}${LOTTERY_NAME_B[Math.floor(index / 12) % 12]}${index >= 144 ? index : ''}`;

const lotteryShuffle = <T,>(items: readonly T[]): T[] => {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
};

// Фразы бота для сцены, которые идут в момент её показа: старт — сразу, итог — когда сцена закончилась
const lotteryChatPlans = new Map<string, { winners: { username: string; returning: boolean }[]; lang: Lang }>();

const lotteryDraw = (total: number, name = username.value) => {
  const names = Array.from({ length: total }, (_, index) => lotteryName(index));
  // Ник из поля — всегда среди участников и первый на победу, чтобы его легко найти на сцене
  if (name && !names.includes(name)) names[names.length - 1] = name;
  const count = Math.min(LOTTERY_CONFIG.WINNERS_COUNT, total);
  const picked = lotteryShuffle(names).slice(0, count);
  const winners = picked.map((winner, index) => ({
    userId: `dev-${winner.toLowerCase()}`,
    username: winner,
    returning: index < lotteryReturning.value,
  }));
  const id = `dev-lottery-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  if (lotteryChat.value) lotteryChatPlans.set(id, { winners, lang: lotteryLang.value });
  send('dev:lottery-draw', {
    id,
    total,
    entries: total <= LOTTERY_ENTRIES_MAX ? names : lotteryShuffle(names).slice(0, LOTTERY_ENTRIES_MAX),
    winners,
    lang: lotteryLang.value,
  });
};

// Оверлей показывает сцену в свою очередь, а фразы бота идут по её началу, а не по нажатию кнопки
watch(
  () => lottery.current,
  (shown) => {
    if (shown?.kind !== 'draw') return;
    const plan = lotteryChatPlans.get(shown.payload.id);
    if (!plan) return;
    lotteryChatPlans.delete(shown.payload.id);
    const t = MESSAGES[plan.lang].lottery;
    botSay(t.start);
    setTimeout(() => botSay(t.final), LOTTERY_SCENE_MS);
  },
);

const lotteryAll = () => LOTTERY_SIZES.forEach((total) => lotteryDraw(total));

const lotteryList = (total: number) =>
  send('dev:lottery-participants', {
    total,
    names: Array.from({ length: Math.min(total, LOTTERY_ENTRIES_MAX) }, (_, index) => lotteryName(index)),
    lang: lotteryLang.value,
  });

const lotteryTicket = () =>
  send('dev:lottery-ticket', { ...alertUser(), lang: lotteryLang.value });

const lotteryDuration = (ms: number) => `${(ms / 1000).toFixed(2)} с`;

onMounted(() => $socket.connect());
onBeforeUnmount(() => $socket.disconnect());

// Превью 1920×1080, уменьшенное под ширину блока
const box = ref<HTMLElement>();
const scale = ref(0.4);
onMounted(() => {
  // Высота превью задана через aspect-ratio, а не через scale: иначе ширина → scale → высота →
  // полоса прокрутки → ширина замыкались в петлю (ResizeObserver loop), когда превью падает на
  // отдельную строку. Само изменение scale откладывается на кадр по той же причине.
  let frame = 0;
  const observer = new ResizeObserver(([entry]) => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      if (entry) scale.value = entry.contentRect.width / 1920;
    });
  });
  if (box.value) observer.observe(box.value);
  onBeforeUnmount(() => {
    cancelAnimationFrame(frame);
    observer.disconnect();
  });
});

// Место под полосу прокрутки занято всегда: она не появляется и не исчезает, не сдвигая превью
useHead({ htmlAttrs: { style: 'scrollbar-gutter: stable' } });

const connectionLabel = { connecting: 'подключаюсь…', connected: 'подключён', disconnected: 'нет связи' };
</script>

<template>
  <main class="min-h-screen bg-sticker-well p-6 font-quicksand text-sticker-ink">
    <h1 class="text-2xl font-bold">Эмулятор событий</h1>
    <p class="mt-1 text-sm text-sticker-muted">
      Сокет: {{ connectionLabel[app.connection] }}. Бот должен быть запущен (<code>pnpm dev</code>).
    </p>

    <div class="mt-5 flex flex-col gap-6 xl:flex-row xl:items-start">
      <div class="flex w-full shrink-0 flex-col gap-y-3 xl:w-96">
        <label class="flex flex-col gap-y-1 text-xs font-bold tracking-widest text-sticker-muted uppercase">
          Ник зрителя (для всех разделов)
          <input v-model="username" class="rounded-lg bg-sticker-track px-3 py-2 text-base text-sticker-ink normal-case" />
        </label>
        <div class="flex flex-wrap gap-2" role="tablist">
          <button
            v-for="item in tabs"
            :key="item.id"
            role="tab"
            :aria-selected="tab === item.id"
            class="rounded-lg px-3 py-1 text-sm font-bold"
            :class="tab === item.id ? 'bg-sticker-edge text-sticker-body' : 'bg-sticker-track'"
            @click="selectTab(item.id)"
          >
            {{ item.label }}
          </button>
        </div>
        <p class="min-h-5 text-sm text-sticker-muted">{{ status }}</p>

      <section v-show="tab === 'stream'" class="flex flex-col gap-y-3">
        <p class="text-sm text-sticker-muted tabular-nums">
          {{ stream.state ? `Уровень ${stream.state.lvl}, ${stream.state.newXp} / ${stream.state.maxXp} XP` : 'Состояние ещё не получено' }}.
          База не меняется.
        </p>
        <label class="flex flex-col gap-y-1 text-xs font-bold tracking-widest text-sticker-muted uppercase">
          XP стрима за нажатие
          <input v-model.number="streamAmount" type="number" min="1" class="rounded-lg bg-sticker-track px-3 py-2 text-base text-sticker-ink" />
        </label>
        <button class="rounded-lg bg-sticker-edge px-3 py-2 font-bold text-sticker-body" @click="addStreamXp">Добавить XP стрима</button>
        <button class="rounded-lg bg-sticker-edge px-3 py-2 font-bold text-sticker-body" @click="streamLevelUp">Повысить уровень стрима</button>
        <button class="rounded-lg bg-sticker-track px-3 py-2 font-bold" @click="resetStream">Вернуть значения из базы</button>

        <h3 class="mt-3 text-xs font-bold tracking-widest text-sticker-muted uppercase">Буст XP</h3>
        <div class="flex gap-x-3">
          <label class="flex flex-1 flex-col gap-y-1 text-xs font-bold tracking-widest text-sticker-muted uppercase">
            Минут
            <input v-model.number="boostMinutes" type="number" min="1" class="rounded-lg bg-sticker-track px-3 py-2 text-base text-sticker-ink" />
          </label>
          <label class="flex flex-1 flex-col gap-y-1 text-xs font-bold tracking-widest text-sticker-muted uppercase">
            Множитель
            <input v-model.number="boostMultiplier" type="number" min="2" max="100" class="rounded-lg bg-sticker-track px-3 py-2 text-base text-sticker-ink" />
          </label>
        </div>
        <button class="rounded-lg bg-sticker-edge px-3 py-2 font-bold text-sticker-body" @click="sendBoost(boostMinutes * 60)">Включить буст</button>
        <button class="rounded-lg bg-sticker-track px-3 py-2 font-bold" @click="sendBoost(10)">Буст на 10 секунд (проверить конец)</button>
        <button class="rounded-lg bg-sticker-track px-3 py-2 font-bold" @click="removeBoost">Убрать буст</button>
        <button class="rounded-lg bg-sticker-track px-3 py-2 font-bold" @click="resetBoost">Вернуть значение из базы</button>
      </section>

      <section v-show="tab === 'timer'" class="flex flex-col gap-y-3">
        <p class="text-sm text-sticker-muted">Таймер показывается над чатом. База не меняется; в чате те же вещи делают <code>!timer</code> и <code>!stoptimer</code>.</p>
        <label class="flex flex-col gap-y-1 text-xs font-bold tracking-widest text-sticker-muted uppercase">
          Название
          <input v-model="timerTitle" maxlength="60" class="rounded-lg bg-sticker-track px-3 py-2 text-base text-sticker-ink normal-case" />
        </label>
        <div class="flex gap-x-3">
          <label class="flex flex-1 flex-col gap-y-1 text-xs font-bold tracking-widest text-sticker-muted uppercase">
            Минут
            <input v-model.number="timerMinutes" type="number" min="0.1" step="any" class="rounded-lg bg-sticker-track px-3 py-2 text-base text-sticker-ink" />
          </label>
          <label class="flex flex-1 flex-col gap-y-1 text-xs font-bold tracking-widest text-sticker-muted uppercase">
            Цвет
            <select v-model="timerColor" class="rounded-lg bg-sticker-track px-3 py-2 text-base text-sticker-ink">
              <option v-for="color in TIMER_COLORS" :key="color" :value="color">{{ color }}</option>
            </select>
          </label>
        </div>
        <button class="rounded-lg bg-sticker-edge px-3 py-2 font-bold text-sticker-body" @click="sendTimer(timerMinutes * 60)">Запустить таймер</button>
        <button class="rounded-lg bg-sticker-track px-3 py-2 font-bold" @click="sendTimer(10)">Таймер на 10 секунд (проверить конец и звук)</button>
        <button class="rounded-lg bg-sticker-track px-3 py-2 font-bold" @click="sendTimer(3725)">Таймер на 1 ч 2 мин (формат ЧЧ:ММ)</button>
        <button class="rounded-lg bg-sticker-track px-3 py-2 font-bold" @click="stopTimer">Остановить таймер</button>
        <button class="rounded-lg bg-sticker-track px-3 py-2 font-bold" @click="resetTimer">Вернуть значение из базы</button>
      </section>

      <section v-show="tab === 'chat'" class="flex flex-col gap-y-3">
        <label class="flex flex-col gap-y-1 text-xs font-bold tracking-widest text-sticker-muted uppercase">
          Текст (Kappa, LUL, PogChamp станут смайлами)
          <input v-model="chatText" class="rounded-lg bg-sticker-track px-3 py-2 text-base text-sticker-ink normal-case" />
        </label>
        <div class="flex gap-x-3">
          <label class="flex flex-1 flex-col gap-y-1 text-xs font-bold tracking-widest text-sticker-muted uppercase">
            Цвет ника
            <input v-model="chatColor" type="color" class="h-10 w-full rounded-lg bg-sticker-track" />
          </label>
          <label class="flex flex-1 flex-col gap-y-1 text-xs font-bold tracking-widest text-sticker-muted uppercase">
            Уровень
            <input v-model.number="chatLvl" type="number" min="1" class="rounded-lg bg-sticker-track px-3 py-2 text-base text-sticker-ink" />
          </label>
        </div>
        <div class="flex flex-wrap gap-x-4 gap-y-1">
          <label v-for="(label, key) in chatRoleLabels" :key="key" class="flex items-center gap-x-1.5 text-sm">
            <input v-model="chatRoles[key]" type="checkbox" />
            {{ label }}
          </label>
        </div>
        <div class="flex items-center gap-x-3 text-sm">
          <label class="flex items-center gap-x-1.5">
            Announcement
            <select v-model="chatAnnounce" class="rounded bg-sticker-track px-2 py-1">
              <option value="">нет</option>
              <option value="blue">blue</option>
              <option value="green">green</option>
              <option value="orange">orange</option>
              <option value="purple">purple</option>
            </select>
          </label>
          <label class="flex items-center gap-x-1.5"><input v-model="chatStreak" type="checkbox" /> watch streak</label>
        </div>
        <button class="rounded-lg bg-sticker-edge px-3 py-2 font-bold text-sticker-body" @click="sendChat">Отправить сообщение</button>
        <label class="flex flex-col gap-y-1 text-sm">
          Герой (полоса героев)
          <select v-model="chatHero" class="rounded-lg bg-sticker-track px-3 py-2 text-base text-sticker-ink">
            <option v-for="hero in HEROES" :key="hero.id" :value="hero.id">{{ hero.name }}</option>
          </select>
        </label>
        <button class="rounded-lg bg-sticker-track px-3 py-2 font-bold" @click="changeHero">Сменить героя у этого зрителя (как !use)</button>
        <button class="rounded-lg bg-sticker-track px-3 py-2 font-bold" @click="chatRolesBurst()">По сообщению от каждой роли</button>
        <button class="rounded-lg bg-sticker-track px-3 py-2 font-bold" @click="chatRolesBurst(true)">Highlight от каждой роли</button>
        <button class="rounded-lg bg-sticker-track px-3 py-2 font-bold" @click="chatSpam">Семь подряд (лимит 5)</button>
        <button class="rounded-lg bg-sticker-track px-3 py-2 font-bold" @click="chatLongLink">Ссылка и длинное слово</button>
      </section>

      <section v-show="tab === 'alerts'" class="flex flex-col gap-y-3">
        <p class="text-sm text-sticker-muted">Ник берётся из поля «Ник». Откройте превью «Алерты» или «Сцена».</p>
        <button class="rounded-lg bg-[#ffd066] px-3 py-2 font-bold text-sticker-body" @click="chest()">
          Сундук из рыбалки (+{{ CHEST_COINS }} в банк)
        </button>
        <button class="rounded-lg bg-sticker-edge px-3 py-2 font-bold text-sticker-body" @click="follow">Follow</button>

        <label class="flex flex-col gap-y-1 text-xs font-bold tracking-widest text-sticker-muted uppercase">
          Зрителей в рейде
          <input v-model.number="raidViewers" type="number" min="0" class="rounded-lg bg-sticker-track px-3 py-2 text-base text-sticker-ink" />
        </label>
        <button class="rounded-lg bg-sticker-edge px-3 py-2 font-bold text-sticker-body" @click="raid">Рейд</button>

        <label class="flex flex-col gap-y-1 text-xs font-bold tracking-widest text-sticker-muted uppercase">
          Название награды
          <input v-model="rewardTitle" maxlength="45" class="rounded-lg bg-sticker-track px-3 py-2 text-base text-sticker-ink normal-case" />
        </label>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="pkg in COIN_EXCHANGE_PACKAGES"
            :key="pkg.title"
            class="rounded-lg bg-sticker-track px-2 py-1 text-xs font-bold text-sticker-ink"
            @click="rewardTitle = pkg.title"
          >
            {{ pkg.title }}
          </button>
        </div>
        <button class="rounded-lg bg-sticker-edge px-3 py-2 font-bold text-sticker-body" @click="reward">Награда за баллы</button>

        <div class="flex gap-x-3">
          <label class="flex flex-1 flex-col gap-y-1 text-xs font-bold tracking-widest text-sticker-muted uppercase">
            Tier
            <select v-model="subTier" class="h-10 rounded-lg bg-sticker-track px-2 text-base text-sticker-ink">
              <option value="1000">1</option>
              <option value="2000">2</option>
              <option value="3000">3</option>
            </select>
          </label>
          <label class="flex flex-1 flex-col gap-y-1 text-xs font-bold tracking-widest text-sticker-muted uppercase">
            Месяцев
            <input v-model.number="subMonths" type="number" min="1" class="w-full rounded-lg bg-sticker-track px-3 py-2 text-base text-sticker-ink" />
          </label>
          <label class="flex flex-1 flex-col gap-y-1 text-xs font-bold tracking-widest text-sticker-muted uppercase">
            Подарков
            <input v-model.number="giftAmount" type="number" min="1" class="w-full rounded-lg bg-sticker-track px-3 py-2 text-base text-sticker-ink" />
          </label>
        </div>
        <button class="rounded-lg bg-sticker-edge px-3 py-2 font-bold text-sticker-body" @click="subNew">Новая подписка</button>
        <button class="rounded-lg bg-sticker-edge px-3 py-2 font-bold text-sticker-body" @click="resub">Продление (resub)</button>
        <button class="rounded-lg bg-sticker-edge px-3 py-2 font-bold text-sticker-body" @click="giftSubs(username)">Подарок подписок</button>
        <button class="rounded-lg bg-sticker-track px-3 py-2 font-bold" @click="giftSubs(null)">Анонимный подарок</button>

        <label class="flex flex-col gap-y-1 text-xs font-bold tracking-widest text-sticker-muted uppercase">
          Bits
          <input v-model.number="bitsAmount" type="number" min="1" class="w-full rounded-lg bg-sticker-track px-3 py-2 text-base text-sticker-ink" />
        </label>
        <button class="rounded-lg bg-sticker-edge px-3 py-2 font-bold text-sticker-body" @click="sendBits(username)">Bits</button>
        <button class="rounded-lg bg-sticker-track px-3 py-2 font-bold" @click="sendBits(null)">Анонимные Bits</button>

        <label class="flex flex-col gap-y-1 text-xs font-bold tracking-widest text-sticker-muted uppercase">
          Watch streak (стримов подряд)
          <input v-model.number="streakValue" type="number" min="1" class="w-full rounded-lg bg-sticker-track px-3 py-2 text-base text-sticker-ink" />
        </label>
        <button class="rounded-lg bg-sticker-edge px-3 py-2 font-bold text-sticker-body" @click="watchStreakBoth">Watch streak: плашка и алерт</button>
        <button class="rounded-lg bg-sticker-edge px-3 py-2 font-bold text-sticker-body" @click="watchStreakAlert()">Только алерт (new)</button>
        <button class="rounded-lg bg-sticker-track px-3 py-2 font-bold" @click="watchStreakAlert(true)">Алерт повторного рубежа (половина)</button>
        <button class="rounded-lg bg-sticker-track px-3 py-2 font-bold" @click="watchStreakChat()">Только плашка в чате</button>
        <button class="rounded-lg bg-sticker-track px-3 py-2 font-bold" @click="allAlerts">Все подряд (очередь)</button>
      </section>

      <section v-show="tab === 'roulette'" class="flex flex-col gap-y-3">
        <p class="text-sm text-sticker-muted">
          Ник берётся из поля «Ник». Откройте превью «Рулетка».
          <NuxtLink class="underline" to="/dev/roulette">Все карточки</NuxtLink>
        </p>
        <label class="flex flex-col gap-y-1 text-xs font-bold tracking-widest text-sticker-muted uppercase">
          Что выпадет
          <select v-model="spinSegment" class="rounded-lg bg-sticker-track px-3 py-2 text-base text-sticker-ink">
            <option v-for="id in ROULETTE_SEGMENT_IDS" :key="id" :value="id">{{ spinLabel(id) }}</option>
          </select>
        </label>
        <button class="rounded-lg bg-sticker-edge px-3 py-2 font-bold text-sticker-body" @click="spin(spinSegment)">Запустить вращение</button>
        <button class="rounded-lg bg-sticker-edge px-3 py-2 font-bold text-sticker-body" @click="spin('jackpot')">Джекпот</button>
        <button class="rounded-lg bg-sticker-track px-3 py-2 font-bold" @click="spinRandom">Случайный слот</button>
        <button class="rounded-lg bg-sticker-track px-3 py-2 font-bold" @click="spinQueue">Три подряд (очередь)</button>

        <h2 class="mt-4 text-lg font-bold">Банк</h2>
        <p class="text-sm text-sticker-muted tabular-nums">
          {{ bank.total === null ? 'Банк ещё не получен' : `Сейчас в шапке: ${bank.total}` }}. База не меняется.
        </p>
        <label class="flex flex-col gap-y-1 text-xs font-bold tracking-widest text-sticker-muted uppercase">
          Сумма
          <input v-model.number="bankInput" type="number" min="0" class="rounded-lg bg-sticker-track px-3 py-2 text-base text-sticker-ink" />
        </label>
        <button class="rounded-lg bg-sticker-edge px-3 py-2 font-bold text-sticker-body" @click="setBank(bankInput)">Показать эту сумму</button>
        <button class="rounded-lg bg-sticker-edge px-3 py-2 font-bold text-sticker-body" @click="setBank((bank.total ?? 0) + 55)">+55 в банк</button>
        <button class="rounded-lg bg-sticker-track px-3 py-2 font-bold" @click="resetBank">Вернуть банк из базы</button>

      </section>

      <section v-show="tab === 'fishing'" class="flex flex-col gap-y-3">
        <p class="text-sm text-sticker-muted">
          Ник берётся из поля «Ник», поклёвка через 3 с. Ответы бота видны в превью «Чат», банк и XP стрима — в «Шапке»,
          алерт сундука — в «Алертах», всё вместе — в «Сцене». База не меняется.
          <NuxtLink class="underline" to="/dev/messages">Все фразы на трёх языках</NuxtLink>
        </p>
        <label class="flex flex-col gap-y-1 text-xs font-bold tracking-widest text-sticker-muted uppercase">
          Язык ответов и алерта сундука
          <select v-model="fishLang" class="rounded-lg bg-sticker-track px-3 py-2 text-base text-sticker-ink">
            <option v-for="lang in LANGS" :key="lang" :value="lang">{{ lang }}</option>
          </select>
        </label>
        <label class="flex flex-col gap-y-1 text-xs font-bold tracking-widest text-sticker-muted uppercase">
          Что поймается
          <select v-model="fishPick" class="rounded-lg bg-sticker-track px-3 py-2 text-base text-sticker-ink">
            <option v-for="id in FISH_CATCH_IDS" :key="id" :value="id">{{ fishLabel(id) }}</option>
          </select>
        </label>
        <button class="rounded-lg bg-sticker-edge px-3 py-2 font-bold text-sticker-body" @click="fish(fishPick)">Забросить удочку</button>
        <button class="rounded-lg bg-sticker-track px-3 py-2 font-bold" @click="fishRandom">Случайный улов (по шансам)</button>
        <button class="rounded-lg bg-sticker-track px-3 py-2 font-bold" @click="botSay(fishTexts.cooldown(username, 42))">Повтор во время кулдауна</button>
        <button class="rounded-lg bg-sticker-track px-3 py-2 font-bold" @click="botSay(fishTexts.already(username))">«Ты уже рыбачишь»</button>
      </section>

      <section v-show="tab === 'pivo'" class="flex flex-col gap-y-3">
        <p class="text-sm text-sticker-muted">
          Ник берётся из поля «Ник». Шанс золота {{ pivoGoldenChance }}%, кулдаун 60 с. Фраза — в «Чате», золотое
          пиво — в «Алертах» (7 с, без звука). База не меняется.
          <NuxtLink class="underline" to="/dev/messages">Все фразы на трёх языках</NuxtLink>
        </p>
        <label class="flex flex-col gap-y-1 text-xs font-bold tracking-widest text-sticker-muted uppercase">
          Язык ответов
          <select v-model="pivoLang" class="rounded-lg bg-sticker-track px-3 py-2 text-base text-sticker-ink">
            <option v-for="lang in LANGS" :key="lang" :value="lang">{{ lang }}</option>
          </select>
        </label>
        <label class="flex flex-col gap-y-1 text-xs font-bold tracking-widest text-sticker-muted uppercase">
          Сколько золотого пива у зрителя
          <input v-model.number="pivoCount" type="number" min="1" class="rounded-lg bg-sticker-track px-3 py-2 text-base text-sticker-ink" />
          <span class="normal-case tracking-normal">
            Ступень {{ getGoldenBeerTier(pivoCount) }} ({{ goldenBeerTierLabel(getGoldenBeerTier(pivoCount)) }}), пороги:
            {{ PIVO_TIER_THRESHOLDS.join(', ') }}
          </span>
        </label>
        <button class="rounded-lg bg-sticker-edge px-3 py-2 font-bold text-sticker-body" @click="pivoRegular()">Обычное пиво</button>
        <button class="rounded-lg bg-[#ffd066] px-3 py-2 font-bold text-sticker-body" @click="pivoGolden()">Золотое пиво (по счётчику)</button>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="(threshold, index) in PIVO_TIER_THRESHOLDS"
            :key="threshold"
            class="rounded-lg bg-sticker-track px-3 py-2 font-bold"
            @click="pivoGolden(username, threshold)"
          >
            Ступень {{ index + 1 }} (x{{ threshold }})
          </button>
        </div>
        <button class="rounded-lg bg-sticker-track px-3 py-2 font-bold" @click="goldenBeer()">Только алерт, без фразы</button>
        <button class="rounded-lg bg-sticker-track px-3 py-2 font-bold" @click="pivoRoll">Бросок по шансам</button>
      </section>

      <section v-show="tab === 'profile'" class="flex flex-col gap-y-3">
        <p class="text-sm text-sticker-muted">
          Карточка по <code>!profile</code>: откройте превью «Профиль» или «Сцена». Ник и цвет — из полей «Ник» и
          «Цвет» во вкладке «Чат».
          <NuxtLink class="underline" to="/dev/achievements">Все значки ачивок</NuxtLink>
        </p>
        <div class="flex gap-x-3">
          <label class="flex min-w-0 flex-1 flex-col gap-y-1 text-xs font-bold tracking-widest text-sticker-muted uppercase">
            Уровень
            <input v-model.number="profileLvl" type="number" min="1" class="w-full min-w-0 rounded-lg bg-sticker-track px-3 py-2 text-base text-sticker-ink" />
          </label>
          <label class="flex min-w-0 flex-1 flex-col gap-y-1 text-xs font-bold tracking-widest text-sticker-muted uppercase">
            XP на уровне, %
            <input v-model.number="profileXpPercent" type="number" min="0" max="100" class="w-full min-w-0 rounded-lg bg-sticker-track px-3 py-2 text-base text-sticker-ink" />
          </label>
          <label class="flex min-w-0 flex-1 flex-col gap-y-1 text-xs font-bold tracking-widest text-sticker-muted uppercase">
            Монеты
            <input v-model.number="profileCoins" type="number" min="0" class="w-full min-w-0 rounded-lg bg-sticker-track px-3 py-2 text-base text-sticker-ink" />
          </label>
        </div>
        <div class="flex items-end gap-x-3">
          <label class="flex min-w-0 flex-1 flex-col gap-y-1 text-xs font-bold tracking-widest text-sticker-muted uppercase">
            Герой
            <select v-model="profileHeroId" :disabled="profileNoHero" class="w-full min-w-0 rounded-lg bg-sticker-track px-3 py-2 text-base text-sticker-ink">
              <option v-for="hero in HEROES" :key="hero.id" :value="hero.id">{{ hero.name }}</option>
            </select>
          </label>
          <label class="flex w-28 shrink-0 flex-col gap-y-1 text-xs font-bold tracking-widest text-sticker-muted uppercase">
            Ур. героя
            <input v-model.number="profileHeroLevel" type="number" min="1" max="50" :disabled="profileNoHero" class="w-full min-w-0 rounded-lg bg-sticker-track px-3 py-2 text-base text-sticker-ink" />
          </label>
          <label class="flex items-center gap-x-1.5 pb-2 text-sm"><input v-model="profileNoHero" type="checkbox" /> без героя</label>
        </div>
        <div class="flex flex-wrap gap-x-4 gap-y-1">
          <label v-for="(label, key) in profileRoleLabels" :key="key" class="flex items-center gap-x-1.5 text-sm">
            <input v-model="profileRoles[key]" type="checkbox" />
            {{ label }}
          </label>
        </div>
        <button class="rounded-lg bg-sticker-edge px-3 py-2 font-bold text-sticker-body" @click="profileShow()">Показать карточку</button>
        <button class="rounded-lg bg-sticker-track px-3 py-2 font-bold" @click="profileShow(PROFILE_SAMPLE)">Пример: полная карточка</button>
        <button class="rounded-lg bg-sticker-track px-3 py-2 font-bold" @click="profileShow(PROFILE_SPARSE)">Пример: новичок без героя</button>
        <button class="rounded-lg bg-sticker-track px-3 py-2 font-bold" @click="profileRolesBurst">По карточке от каждой роли</button>
      </section>

      <section v-show="tab === 'leaderboard'" class="flex flex-col gap-y-3">
        <p class="text-sm text-sticker-muted">
          Награда «Flex Leaderboard»: откройте превью «Лидерборд» или «Сцена». Карточка висит 9 секунд.
        </p>
        <button class="rounded-lg bg-sticker-edge px-3 py-2 font-bold text-sticker-body" @click="leaderboardShow(false)">Активировавший вне топа</button>
        <button class="rounded-lg bg-sticker-track px-3 py-2 font-bold" @click="leaderboardShow(true)">Активировавший в топе</button>
      </section>

      <section v-show="tab === 'shop'" class="flex flex-col gap-y-3">
        <p class="text-sm text-sticker-muted">
          Окно по <code>{{ vipPrefix }}shop</code>: откройте превью «Магазин» или «Сцена». Ник — из поля «Ник». Окно
          показывает баланс, у каждого героя — статы, цену и состояние: куплен, надет, не хватает монет. База не меняется.
        </p>
        <div class="flex flex-wrap items-end gap-x-3 gap-y-2">
          <label class="flex flex-col gap-y-1 text-sm">
            Монеты
            <input v-model.number="shopCoins" type="number" min="0" class="w-32 min-w-0 rounded-lg bg-sticker-track px-3 py-2 text-base text-sticker-ink" />
          </label>
          <label class="flex flex-col gap-y-1 text-sm">
            Надет
            <select v-model="shopActiveId" class="min-w-0 rounded-lg bg-sticker-track px-3 py-2 text-base text-sticker-ink">
              <option v-for="hero in HEROES" :key="hero.id" :value="hero.id">{{ hero.name }}</option>
            </select>
          </label>
        </div>
        <div class="flex flex-wrap gap-x-4 gap-y-1">
          <label v-for="hero in HEROES" :key="hero.id" class="flex items-center gap-x-1.5 text-sm">
            <input v-model="shopOwned[hero.id]" type="checkbox" />
            куплен: {{ hero.name }}
          </label>
        </div>
        <button class="rounded-lg bg-sticker-edge px-3 py-2 font-bold text-sticker-body" @click="shopShow()">Показать магазин</button>
        <button class="rounded-lg bg-sticker-track px-3 py-2 font-bold" @click="shopShow({ coins: 0, ownedHeroIds: [DEFAULT_HERO_ID], activeHeroId: DEFAULT_HERO_ID })">Пример: новичок без монет</button>
        <button class="rounded-lg bg-sticker-track px-3 py-2 font-bold" @click="shopShow({ coins: 500, ownedHeroIds: [DEFAULT_HERO_ID], activeHeroId: DEFAULT_HERO_ID })">Пример: хватает на Robber</button>
        <button class="rounded-lg bg-sticker-track px-3 py-2 font-bold" @click="shopShow({ coins: 12_450, ownedHeroIds: HEROES.map((hero) => hero.id), activeHeroId: HEROES[HEROES.length - 1]?.id ?? null })">Пример: всё куплено</button>
      </section>

      <section v-show="tab === 'vip'" class="flex flex-col gap-y-3">
        <p class="text-sm text-sticker-muted">
          Команды: <code>{{ vipPrefix }}addvip ник</code> (алиас <code>{{ vipPrefix }}vip</code>) и
          <code>{{ vipPrefix }}removevip ник</code> (алиас <code>{{ vipPrefix }}rvip</code>), только стример и
          модератор, кулдаун 10 с. Роль «VIP» в чате — бейдж Twitch или флаг из базы; видно в «Чате». База не меняется.
          <NuxtLink class="underline" to="/dev/messages">Все фразы на трёх языках</NuxtLink>
        </p>
        <label class="flex flex-col gap-y-1 text-xs font-bold tracking-widest text-sticker-muted uppercase">
          Язык ответов
          <select v-model="vipLang" class="rounded-lg bg-sticker-track px-3 py-2 text-base text-sticker-ink">
            <option v-for="lang in LANGS" :key="lang" :value="lang">{{ lang }}</option>
          </select>
        </label>
        <div class="flex gap-x-3">
          <label class="flex flex-1 flex-col gap-y-1 text-xs font-bold tracking-widest text-sticker-muted uppercase">
            Кто выдаёт
            <input v-model="vipModerator" maxlength="25" class="rounded-lg bg-sticker-track px-3 py-2 text-base text-sticker-ink normal-case" />
          </label>
          <label class="flex flex-1 flex-col gap-y-1 text-xs font-bold tracking-widest text-sticker-muted uppercase">
            Кому
            <input v-model="vipTarget" maxlength="25" class="rounded-lg bg-sticker-track px-3 py-2 text-base text-sticker-ink normal-case" />
          </label>
        </div>
        <button class="rounded-lg bg-sticker-edge px-3 py-2 font-bold text-sticker-body" @click="vipAdd">!addvip: фраза и алерт</button>
        <button class="rounded-lg bg-sticker-edge px-3 py-2 font-bold text-sticker-body" @click="vipRemove">!removevip: фраза</button>
        <button class="rounded-lg bg-sticker-track px-3 py-2 font-bold" @click="vipUnlocked()">Только алерт «vip unlocked»</button>
        <button class="rounded-lg bg-sticker-track px-3 py-2 font-bold" @click="botSay(vipTexts.usage(username, vipPrefix, 'addvip'))">Без ника (!addvip)</button>
        <button class="rounded-lg bg-sticker-track px-3 py-2 font-bold" @click="botSay(vipTexts.usage(username, vipPrefix, 'removevip'))">Без ника (!removevip)</button>
        <button class="rounded-lg bg-sticker-track px-3 py-2 font-bold" @click="botSay(vipTexts.notFound(vipTarget))">Ник не найден</button>
        <button class="rounded-lg bg-sticker-track px-3 py-2 font-bold" @click="botSay(vipTexts.denied(username))">Нет прав</button>
        <button class="rounded-lg bg-sticker-track px-3 py-2 font-bold" @click="botSay(vipTexts.failed(username))">Twitch не принял</button>
      </section>

      <section v-show="tab === 'lottery'" class="flex flex-col gap-y-3">
        <p class="text-sm text-sticker-muted">
          Команды: <code>{{ vipPrefix }}ticket</code> (алиас <code>{{ vipPrefix }}билет</code>) — сколько XP до билета,
          <code>{{ vipPrefix }}tickets</code> (<code>{{ vipPrefix }}розыгрыш</code>) — держатели билетов (от
          {{ LOTTERY_LIST_MIN }} — списком на оверлее), <code>{{ vipPrefix }}runlottery</code> (<code>{{ vipPrefix }}lottery</code>,
          <code>{{ vipPrefix }}лотерея</code>) — розыгрыш {{ LOTTERY_CONFIG.WINNERS_COUNT }} VIP, только стример. Билет
          даёт {{ LOTTERY_CONFIG.TICKET_XP_THRESHOLD }} недельного XP. Сцена всегда идёт
          {{ lotteryDuration(LOTTERY_SCENE_MS) }}. Превью «Лотерея» или «Сцена». База и Twitch не меняются.
          <NuxtLink class="underline" to="/dev/messages">Все фразы на трёх языках</NuxtLink>
        </p>
        <label class="flex flex-col gap-y-1 text-xs font-bold tracking-widest text-sticker-muted uppercase">
          Язык сцены и фраз бота
          <select v-model="lotteryLang" class="rounded-lg bg-sticker-track px-3 py-2 text-base text-sticker-ink">
            <option v-for="lang in LANGS" :key="lang" :value="lang">{{ lang }}</option>
          </select>
        </label>
        <div class="flex gap-x-3">
          <label class="flex flex-1 flex-col gap-y-1 text-xs font-bold tracking-widest text-sticker-muted uppercase">
            Победителей с VIP с прошлой недели
            <input v-model.number="lotteryReturning" type="number" min="0" max="5" class="rounded-lg bg-sticker-track px-3 py-2 text-base text-sticker-ink" />
          </label>
        </div>
        <label class="flex items-center gap-x-1.5 text-sm">
          <input v-model="lotteryChat" type="checkbox" /> писать фразы бота в чат (старт, места, финал)
        </label>

        <h3 class="mt-1 text-xs font-bold tracking-widest text-sticker-muted uppercase">Розыгрыш: сколько участников</h3>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="total in LOTTERY_SIZES"
            :key="total"
            class="rounded-lg bg-sticker-edge px-3 py-2 font-bold text-sticker-body"
            @click="lotteryDraw(total)"
          >
            {{ total }}
          </button>
        </div>
        <button class="rounded-lg bg-sticker-track px-3 py-2 font-bold" @click="lotteryAll">
          Все семь подряд (очередь, около {{ Math.ceil((LOTTERY_SCENE_MS * LOTTERY_SIZES.length) / 60000) }} минут)
        </button>
        <button class="rounded-lg bg-sticker-track px-3 py-2 font-bold" @click="spin('coins500'); lotteryDraw(8)">
          Спин рулетки, сразу за ним розыгрыш (ждёт рулетку)
        </button>
        <button class="rounded-lg bg-sticker-track px-3 py-2 font-bold" @click="lotteryDraw(8); follow()">
          Розыгрыш и follow (алерт ждёт розыгрыш)
        </button>

        <h3 class="mt-1 text-xs font-bold tracking-widest text-sticker-muted uppercase">Замер: сколько шла сцена</h3>
        <p v-if="!lottery.log.length" class="text-sm text-sticker-muted">Пока не было розыгрышей на этой странице.</p>
        <ul v-else class="flex flex-col gap-y-1 text-sm tabular-nums">
          <li v-for="item in lottery.log" :key="item.id" class="flex justify-between rounded-lg bg-sticker-track px-3 py-1.5">
            <span>{{ item.total }} участн., {{ item.winners }} побед.</span>
            <span class="font-bold">{{ lotteryDuration(item.ms) }}</span>
          </li>
        </ul>

        <h3 class="mt-1 text-xs font-bold tracking-widest text-sticker-muted uppercase">Список билетов и билет</h3>
        <button class="rounded-lg bg-sticker-edge px-3 py-2 font-bold text-sticker-body" @click="lotteryList(LOTTERY_LIST_MIN + 2)">Список: {{ LOTTERY_LIST_MIN + 2 }} билетов</button>
        <button class="rounded-lg bg-sticker-edge px-3 py-2 font-bold text-sticker-body" @click="lotteryList(240)">Список: 240 билетов (с «ещё»)</button>
        <button class="rounded-lg bg-sticker-edge px-3 py-2 font-bold text-sticker-body" @click="lotteryTicket">Алерт «lottery ticket»</button>

        <h3 class="mt-1 text-xs font-bold tracking-widest text-sticker-muted uppercase">Фразы бота в чат</h3>
        <button class="rounded-lg bg-sticker-track px-3 py-2 font-bold" @click="botSay(lotteryTexts.ticketEarned(username))">Билет получен</button>
        <button class="rounded-lg bg-sticker-track px-3 py-2 font-bold" @click="botSay(lotteryTexts.ticketProgress(username, 37, LOTTERY_CONFIG.TICKET_XP_THRESHOLD))">!ticket: прогресс</button>
        <button class="rounded-lg bg-sticker-track px-3 py-2 font-bold" @click="botSay(lotteryTexts.ticketHave(username))">!ticket: билет уже есть</button>
        <button class="rounded-lg bg-sticker-track px-3 py-2 font-bold" @click="botSay(lotteryTexts.noTicketsYet)">!tickets: билетов нет</button>
        <button class="rounded-lg bg-sticker-track px-3 py-2 font-bold" @click="botSay(lotteryTexts.totalTickets(42))">!tickets: 42 билета</button>
        <button class="rounded-lg bg-sticker-track px-3 py-2 font-bold" @click="botSay(lotteryTexts.ticketList('🔹 1. @Fox, 🔹 2. @Lynx, 🔹 3. @Wolf', 3, LOTTERY_CONFIG.TICKET_XP_THRESHOLD))">!tickets: список до 10</button>
        <button class="rounded-lg bg-sticker-track px-3 py-2 font-bold" @click="botSay(lotteryTexts.postponed)">Розыгрыш без билетов</button>
        <button class="rounded-lg bg-sticker-track px-3 py-2 font-bold" @click="botSay(lotteryTexts.alreadyRunning(username))">Розыгрыш уже идёт</button>
        <button class="rounded-lg bg-sticker-track px-3 py-2 font-bold" @click="botSay(lotteryTexts.vipFailed(username))">Twitch не выдал VIP</button>
        <button class="rounded-lg bg-sticker-track px-3 py-2 font-bold" @click="botSay(MESSAGES[lotteryLang].denied(username))">Нет прав (не стример)</button>
      </section>

      <section v-show="tab === 'music'" class="flex flex-col gap-y-3">
        <p class="text-sm text-sticker-muted">Эмулятор не трогает настоящий плеер: после перезагрузки сцены вернётся реальное состояние.</p>
        <button class="rounded-lg bg-sticker-edge px-3 py-2 font-bold text-sticker-body" @click="sendMusic({})">Играет трек</button>
        <button class="rounded-lg bg-sticker-track px-3 py-2 font-bold" @click="sendMusic({ isPlaying: false })">Пауза</button>
        <button class="rounded-lg bg-sticker-track px-3 py-2 font-bold" @click="sendMusic({ title: 'A very long track title that cannot possibly fit into the card (extended radio edit, 2026 remaster)', positionMs: 5_000 })">Длинное название (бегущая строка)</button>
        <button class="rounded-lg bg-sticker-track px-3 py-2 font-bold" @click="sendMusic({ title: 'Lofi Radio', artist: 'Live stream', durationMs: 0, positionMs: 0, artwork: null })">Радио (без полоски и обложки)</button>
        <button class="rounded-lg bg-sticker-track px-3 py-2 font-bold" @click="sendMusic(null)">Скрыть виджет</button>
        <p class="text-sm text-sticker-muted">Эмулятор шлёт одно состояние: через 45 секунд без новых виджет сам погаснет, как при остановке плеера.</p>
      </section>
      </div>

      <section class="min-w-0 flex-1 xl:sticky xl:top-6">
        <div class="mb-2 flex gap-x-2">
          <button
            v-for="item in previews"
            :key="item.label"
            class="rounded-lg px-3 py-1 text-sm font-bold"
            :class="preview.label === item.label ? 'bg-sticker-edge text-sticker-body' : 'bg-sticker-track'"
            @click="preview = item"
          >
            {{ item.label }}
          </button>
        </div>
        <div ref="box" class="relative w-full overflow-hidden rounded-xl border-2 border-sticker-edge checker" :style="{ aspectRatio: '16 / 9' }">
          <iframe
            v-for="path in preview.paths"
            :key="path"
            :src="path"
            class="absolute top-0 left-0 origin-top-left border-0"
            :style="{ width: '1920px', height: '1080px', transform: `scale(${scale})` }"
          />
        </div>
      </section>
    </div>
  </main>
</template>

<style scoped>
.checker {
  background-color: #3a3440;
  background-image:
    linear-gradient(45deg, #2f2a35 25%, transparent 25%, transparent 75%, #2f2a35 75%),
    linear-gradient(45deg, #2f2a35 25%, transparent 25%, transparent 75%, #2f2a35 75%);
  background-size: 24px 24px;
  background-position: 0 0, 12px 12px;
}
</style>
