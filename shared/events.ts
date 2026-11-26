import { LANGS, type Lang } from './i18n';
import { PIVO_TIER_THRESHOLDS } from './pivo';
import type { RoulettePrizeType } from './roulette';

const PIVO_TIER_COUNT = PIVO_TIER_THRESHOLDS.length;

// Контракты событий Socket.io: один файл для бота (сервер) и Nuxt (клиент).
// Сервер живёт в bot/ (bot/src/socket.ts), оверлей подключается к нему как клиент.
// Имена событий — «домен:действие», как в docs/spec.md, раздел 3.

export type ChatAnnounceColor = 'blue' | 'green' | 'orange' | 'purple';

// Сообщение в чате канала. Поля те же, что у `chat:message` в старом fox-sphere, кроме `hero`
// (герои ещё не перенесены). `badges` — готовые адреса картинок, `emotes` — как в теге Twitch:
// id смайла → позиции «начало-конец» в тексте (в символах, а не в байтах).
export type ChatMessagePayload = {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  color: string;
  text: string;
  badges: string[];
  emotes: Record<string, string[]>;
  timestamp: number;
  userLvl: number;
  isMod: boolean;
  isFollower: boolean;
  isFounder: boolean;
  isSubscriber: boolean;
  isVip: boolean;
  isPermanentVip: boolean;
  isBroadcaster: boolean;
  isBot: boolean;
  isHighlight: boolean;
  isAction: boolean;
  isAnnouncement?: boolean;
  announceColor?: ChatAnnounceColor;
  watchStreak?: { value: number; reward: number };
};

// Состояние стрима для шапки. Поля те же, что у `stream:xp-updated` в старом fox-sphere:
// `newXp` — весь накопленный XP стрима, `startXp` и `maxXp` — границы уровня `lvl`.
export type StreamStatePayload = {
  lvl: number;
  newXp: number;
  maxXp: number;
  startXp: number;
};

// Алерты (/overlay/alerts). Имена событий и поля follow, raid и reward — как в старом fox-sphere.
export type FollowPayload = {
  userId: string;
  username: string;
};

export type RaidPayload = {
  raiderId: string;
  raiderName: string;
  viewers: number;
};

export type RewardRedeemPayload = {
  userId: string;
  username: string;
  rewardTitle: string;
  redemptionId: string;
};

// Уровень подписки в обозначениях Twitch: 1000 — первый, 2000 — второй, 3000 — третий
export type SubTier = '1000' | '2000' | '3000';

// Подписки (в старом проекте таких алертов не было). `new` — первая подписка, `resub` — продление,
// которым зритель поделился в чате (`months` — всего месяцев), `gift` — подарок `amount` подписок,
// `username: null` — анонимный. Получатели подарка отдельных событий не дают.
export type SubPayload =
  | { kind: 'new'; userId: string; username: string; tier: SubTier }
  | { kind: 'resub'; userId: string; username: string; tier: SubTier; months: number }
  | { kind: 'gift'; username: string | null; tier: SubTier; amount: number };

// Сундук из рыбалки: `coinAmount` монет ушли в банк рулетки, сам банк приходит отдельно
// (`stream:jackpot-updated`). `lang` — язык бота, на нём подписи алерта.
export type FishingChestPayload = {
  userId: string;
  username: string;
  coinAmount: number;
  lang: Lang;
};

// VIP, выданный командой `!addvip`. Поля те же, что у `twitch:add-vip` в старом fox-sphere, но
// `twitchId` назван `userId`, как у остальных алертов. Снятие VIP алерта не даёт.
export type AddVipPayload = {
  userId: string;
  username: string;
};

// Золотое пиво из `!pivo` (5%). Поля те же, что у `twitch:golden-beer` в старом fox-sphere, без
// `displayName`: ник один, как у остальных алертов. `goldenBeers` — счётчик за всё время,
// `tier` — ступень 1..5 по нему (shared/pivo.ts), `isNewTier` — этим пивом ступень выросла.
export type GoldenBeerPayload = {
  userId: string;
  username: string;
  goldenBeers: number;
  tier: number;
  isNewTier: boolean;
};

// Рулетка. Поля те же, что у `roulette:spin-result` в старом fox-sphere. Приходит в момент старта
// ленты; через ROULETTE_SPIN_ANIMATION_MS лента встаёт на этом призе. `coinAmount` у джекпота — весь
// забранный банк, `jackpotTotalAfter` — банк после спина.
export type RouletteSpinResultPayload = {
  userId: string;
  username: string;
  prizeType: RoulettePrizeType;
  coinAmount: number;
  xpAmount: number;
  jackpotWon: boolean;
  jackpotTotalAfter: number;
};

// Банк рулетки. После спина приходит в момент остановки ленты, чтобы шапка не выдала результат раньше.
export type JackpotPayload = {
  jackpotTotal: number;
};

// Буст XP стрима: `multiplier` раз больше XP за сообщение (зрителю и стриму) до `expiresAt`
// (epoch мс, абсолютный момент: оверлей считает остаток сам). `null` в событии = буста нет
// (отменён командой). Ответ на `stream:get-xp-boost` — тот же формат, `null` = буста нет.
export type XpBoostPayload = {
  multiplier: number;
  expiresAt: number;
};

// Цвета бумаги таймера (`!timer 5 red BRB`); по умолчанию blue. Те же шесть, что в DESIGN.md.
export const TIMER_COLORS = ['amber', 'blue', 'cyan', 'purple', 'red', 'rose'] as const;
export type TimerColor = (typeof TIMER_COLORS)[number];

// Идущий `!timer`. `endsAt` — абсолютный момент окончания (epoch мс), а не остаток: так таймер
// переживает перезагрузку сцены OBS, второй открытый оверлей и рестарт бота. Остаток каждая
// копия оверлея считает сама от часов машины.
export type TimerPayload = {
  title: string;
  color: TimerColor;
  endsAt: number;
};

// «Сейчас играет» (/overlay/music). Бот читает системную медиасессию Windows и шлёт состояние.
// `positionMs` уже посчитана читателем (Brave обновляет позицию в системе только на старте трека
// и при перемотке), `sentAt` — Date.now() на момент отправки: по нему оверлей добирает дорогу
// и отбрасывает устаревшее состояние. `artwork` — data URL, и приходит только при смене трека:
// у повторных состояний того же трека он `null`, бот возвращает прежнюю картинку (`mergeNowPlaying`).
// `durationMs = 0` — поток без таймлайна (радио): полоски нет. `null` в событии = скрыть виджет.
export type MusicNowPlayingPayload = {
  title: string;
  artist: string;
  album: string | null;
  artwork: string | null;
  durationMs: number;
  positionMs: number;
  isPlaying: boolean;
  sentAt: number;
};

// Сервер → оверлей
export type ServerToClientEvents = {
  'music:now-playing': (payload: MusicNowPlayingPayload | null) => void;
  'roulette:spin-result': (payload: RouletteSpinResultPayload) => void;
  'stream:jackpot-updated': (payload: JackpotPayload) => void;
  'chat:message': (payload: ChatMessagePayload) => void;
  'stream:xp-updated': (payload: StreamStatePayload) => void;
  'stream:xp-boost': (payload: XpBoostPayload | null) => void;
  'twitch:timer': (payload: TimerPayload) => void;
  'twitch:timer-stop': () => void;
  'twitch:follow': (payload: FollowPayload) => void;
  'twitch:raid': (payload: RaidPayload) => void;
  'twitch:reward-redeem': (payload: RewardRedeemPayload) => void;
  'twitch:sub': (payload: SubPayload) => void;
  'fishing:chest': (payload: FishingChestPayload) => void;
  'twitch:golden-beer': (payload: GoldenBeerPayload) => void;
  'twitch:add-vip': (payload: AddVipPayload) => void;
};

export type DevAck = (result: { ok: boolean; reason?: string }) => void;

// Оверлей → сервер.
// `stream:get-system-state` и `stream:get-jackpot` — запрос состояния при подключении;
// null, если бот не смог прочитать базу.
// События `dev:*` принимаются только эмулятором (/dev/events) и только при DEV_EVENTS=true:
// сервер проверяет payload и рассылает его всем оверлеям, как будто событие прислал бот.
// В базу они ничего не пишут; `dev:stream-reset` и `dev:jackpot-reset` возвращают оверлеям значения
// из базы. `dev:roulette-spin` встаёт в ту же очередь вращений, что и настоящие спины.
export type ClientToServerEvents = {
  'stream:get-system-state': (ack: (state: StreamStatePayload | null) => void) => void;
  'stream:get-jackpot': (ack: (state: JackpotPayload | null) => void) => void;
  'stream:get-xp-boost': (ack: (state: XpBoostPayload | null) => void) => void;
  'twitch:get-timer': (ack: (state: TimerPayload | null) => void) => void;
  'music:get-current': (ack: (state: MusicNowPlayingPayload | null) => void) => void;
  'dev:music': (payload: unknown, ack?: DevAck) => void;
  'dev:roulette-spin': (payload: unknown, ack?: DevAck) => void;
  'dev:jackpot': (payload: unknown, ack?: DevAck) => void;
  'dev:jackpot-reset': (ack?: DevAck) => void;
  'dev:chat-message': (payload: unknown, ack?: DevAck) => void;
  'dev:stream-state': (payload: unknown, ack?: DevAck) => void;
  'dev:stream-reset': (ack?: DevAck) => void;
  'dev:xp-boost': (payload: unknown, ack?: DevAck) => void;
  'dev:xp-boost-reset': (ack?: DevAck) => void;
  'dev:timer': (payload: unknown, ack?: DevAck) => void;
  'dev:timer-stop': (ack?: DevAck) => void;
  'dev:timer-reset': (ack?: DevAck) => void;
  'dev:follow': (payload: unknown, ack?: DevAck) => void;
  'dev:raid': (payload: unknown, ack?: DevAck) => void;
  'dev:reward-redeem': (payload: unknown, ack?: DevAck) => void;
  'dev:sub': (payload: unknown, ack?: DevAck) => void;
  'dev:fishing-chest': (payload: unknown, ack?: DevAck) => void;
  'dev:golden-beer': (payload: unknown, ack?: DevAck) => void;
  'dev:add-vip': (payload: unknown, ack?: DevAck) => void;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0 && value.length <= 64;

const isInt = (value: unknown, min: number, max = 1_000_000_000): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max;

export const isStreamStatePayload = (value: unknown): value is StreamStatePayload =>
  isRecord(value) &&
  isInt(value.lvl, 1) &&
  isInt(value.newXp, 0) &&
  isInt(value.startXp, 0) &&
  isInt(value.maxXp, 1) &&
  value.maxXp > value.startXp;

export const isXpBoostPayload = (value: unknown): value is XpBoostPayload =>
  isRecord(value) && isInt(value.multiplier, 2, 100) && isInt(value.expiresAt, 0, Number.MAX_SAFE_INTEGER);

// `null` — «буста нет»: так проверяется и строка из эмулятора, и ответ базы
export const isXpBoostOrNull = (value: unknown): value is XpBoostPayload | null =>
  value === null || isXpBoostPayload(value);

export const TIMER_TITLE_MAX = 60;
const TIMER_COLOR_LIST: readonly unknown[] = TIMER_COLORS;

export const isTimerPayload = (value: unknown): value is TimerPayload =>
  isRecord(value) &&
  typeof value.title === 'string' &&
  value.title.length > 0 &&
  value.title.length <= TIMER_TITLE_MAX &&
  TIMER_COLOR_LIST.includes(value.color) &&
  isInt(value.endsAt, 0, Number.MAX_SAFE_INTEGER);

const ANNOUNCE_COLORS: readonly string[] = ['blue', 'green', 'orange', 'purple'];
const CHAT_FLAGS = [
  'isMod',
  'isFollower',
  'isFounder',
  'isSubscriber',
  'isVip',
  'isPermanentVip',
  'isBroadcaster',
  'isBot',
  'isHighlight',
  'isAction',
] as const;

const isStringArray = (value: unknown, maxLength: number): value is string[] =>
  Array.isArray(value) && value.length <= maxLength && value.every((item) => typeof item === 'string');

// Проверка для эмулятора: настоящие сообщения бот строит сам и сюда не передаёт
export const isChatMessagePayload = (value: unknown): value is ChatMessagePayload => {
  if (!isRecord(value)) return false;
  if (!isNonEmptyString(value.id) || !isNonEmptyString(value.userId)) return false;
  if (!isNonEmptyString(value.username) || !isNonEmptyString(value.displayName)) return false;
  if (typeof value.color !== 'string' || value.color.length > 16) return false;
  if (typeof value.text !== 'string' || value.text.length > 500) return false;
  if (!isStringArray(value.badges, 10) || !isInt(value.userLvl, 1)) return false;
  // timestamp — миллисекунды (Date.now()), они не помещаются в общий лимит isInt
  if (!isInt(value.timestamp, 0, Number.MAX_SAFE_INTEGER)) return false;
  if (!CHAT_FLAGS.every((flag) => typeof value[flag] === 'boolean')) return false;
  if (!isRecord(value.emotes) || !Object.values(value.emotes).every((positions) => isStringArray(positions, 50))) {
    return false;
  }
  if (value.isAnnouncement !== undefined && typeof value.isAnnouncement !== 'boolean') return false;
  if (value.announceColor !== undefined && !ANNOUNCE_COLORS.includes(String(value.announceColor))) return false;
  if (value.watchStreak !== undefined) {
    if (!isRecord(value.watchStreak) || !isInt(value.watchStreak.value, 1) || !isInt(value.watchStreak.reward, 0)) {
      return false;
    }
  }
  return true;
};

export const isFollowPayload = (value: unknown): value is FollowPayload =>
  isRecord(value) && isNonEmptyString(value.userId) && isNonEmptyString(value.username);

export const isRaidPayload = (value: unknown): value is RaidPayload =>
  isRecord(value) &&
  isNonEmptyString(value.raiderId) &&
  isNonEmptyString(value.raiderName) &&
  isInt(value.viewers, 0);

export const isRewardRedeemPayload = (value: unknown): value is RewardRedeemPayload =>
  isRecord(value) &&
  isNonEmptyString(value.userId) &&
  isNonEmptyString(value.username) &&
  isNonEmptyString(value.rewardTitle) &&
  isNonEmptyString(value.redemptionId);

const SUB_TIERS: readonly unknown[] = ['1000', '2000', '3000'];

export const isSubPayload = (value: unknown): value is SubPayload => {
  if (!isRecord(value) || !SUB_TIERS.includes(value.tier)) return false;
  if (value.kind === 'gift') {
    return (value.username === null || isNonEmptyString(value.username)) && isInt(value.amount, 1);
  }
  if (!isNonEmptyString(value.userId) || !isNonEmptyString(value.username)) return false;
  return value.kind === 'new' || (value.kind === 'resub' && isInt(value.months, 1));
};

const KNOWN_LANGS: readonly unknown[] = LANGS;

export const isFishingChestPayload = (value: unknown): value is FishingChestPayload =>
  isRecord(value) &&
  isNonEmptyString(value.userId) &&
  isNonEmptyString(value.username) &&
  isInt(value.coinAmount, 1) &&
  KNOWN_LANGS.includes(value.lang);

export const isAddVipPayload = (value: unknown): value is AddVipPayload =>
  isRecord(value) && isNonEmptyString(value.userId) && isNonEmptyString(value.username);

export const isGoldenBeerPayload = (value: unknown): value is GoldenBeerPayload =>
  isRecord(value) &&
  isNonEmptyString(value.userId) &&
  isNonEmptyString(value.username) &&
  isInt(value.goldenBeers, 1) &&
  isInt(value.tier, 1, PIVO_TIER_COUNT) &&
  typeof value.isNewTier === 'boolean';

const PRIZE_TYPES: readonly unknown[] = ['empty', 'coins', 'xp', 'jackpot'];

export const isRouletteSpinPayload = (value: unknown): value is RouletteSpinResultPayload =>
  isRecord(value) &&
  isNonEmptyString(value.userId) &&
  isNonEmptyString(value.username) &&
  PRIZE_TYPES.includes(value.prizeType) &&
  isInt(value.coinAmount, 0) &&
  isInt(value.xpAmount, 0) &&
  value.jackpotWon === (value.prizeType === 'jackpot') &&
  isInt(value.jackpotTotalAfter, 0);

export const isJackpotPayload = (value: unknown): value is JackpotPayload =>
  isRecord(value) && isInt(value.jackpotTotal, 0);

// `payload === null` — «ничего не играет»: так же проверяется и строка от читателя, и эмулятор.
const MAX_ARTWORK_LENGTH = 400_000;
const MAX_MUSIC_MS = 7 * 24 * 3600 * 1000;

export const isMusicNowPlayingPayload = (value: unknown): value is MusicNowPlayingPayload =>
  isRecord(value) &&
  typeof value.title === 'string' &&
  value.title.length > 0 &&
  value.title.length <= 300 &&
  typeof value.artist === 'string' &&
  value.artist.length <= 300 &&
  (value.album === null || (typeof value.album === 'string' && value.album.length <= 300)) &&
  (value.artwork === null ||
    (typeof value.artwork === 'string' &&
      value.artwork.startsWith('data:image/') &&
      value.artwork.length <= MAX_ARTWORK_LENGTH)) &&
  isInt(value.durationMs, 0, MAX_MUSIC_MS) &&
  isInt(value.positionMs, 0, MAX_MUSIC_MS) &&
  typeof value.isPlaying === 'boolean' &&
  isInt(value.sentAt, 0, Number.MAX_SAFE_INTEGER);

export const isMusicPayloadOrNull = (value: unknown): value is MusicNowPlayingPayload | null =>
  value === null || isMusicNowPlayingPayload(value);

// Порт Socket.io-сервера бота. Один на dev и prod, если не задан SOCKET_PORT:
// чтобы запускать оба окружения на одной машине, разведите порты в .env.*.
export const DEFAULT_SOCKET_PORT = 3002;

export const resolveSocketPort = (raw: string | undefined): number => {
  const port = Number(raw);
  return Number.isInteger(port) && port > 0 && port < 65536 ? port : DEFAULT_SOCKET_PORT;
};
