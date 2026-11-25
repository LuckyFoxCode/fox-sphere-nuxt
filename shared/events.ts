// Контракты событий Socket.io: один файл для бота (сервер) и Nuxt (клиент).
// Сервер живёт в bot/ (bot/src/socket.ts), оверлей подключается к нему как клиент.
// Имена событий — «домен:действие», как в docs/spec.md, раздел 3.

// Бот начислил зрителю XP за сообщение.
// `lvl` — уровень, на котором полоса показывалась ДО начисления, а `totalXp` — XP ПОСЛЕ него.
// Если начисление перевело зрителя на новый уровень, totalXp >= порога lvl, и полоса упирается
// в 100%; сам переход приходит отдельным `level:up`.
export type XpGainPayload = {
  twitchId: string;
  username: string;
  amount: number;
  totalXp: number;
  lvl: number;
};

// Зритель перешёл на новый уровень (fromLvl < toLvl; за одно сообщение можно перескочить несколько).
export type LevelUpPayload = {
  twitchId: string;
  username: string;
  fromLvl: number;
  toLvl: number;
};

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

// Сервер → оверлей
export type ServerToClientEvents = {
  'xp:gain': (payload: XpGainPayload) => void;
  'level:up': (payload: LevelUpPayload) => void;
  'chat:message': (payload: ChatMessagePayload) => void;
  'stream:xp-updated': (payload: StreamStatePayload) => void;
  'twitch:follow': (payload: FollowPayload) => void;
  'twitch:raid': (payload: RaidPayload) => void;
  'twitch:reward-redeem': (payload: RewardRedeemPayload) => void;
  'twitch:sub': (payload: SubPayload) => void;
};

export type DevAck = (result: { ok: boolean; reason?: string }) => void;

// Оверлей → сервер.
// `stream:get-system-state` — запрос состояния при подключении; null, если бот не смог прочитать базу.
// События `dev:*` принимаются только эмулятором (/dev/events) и только при DEV_EVENTS=true:
// сервер проверяет payload и рассылает его всем оверлеям, как будто событие прислал бот.
// В базу они ничего не пишут; `dev:stream-reset` возвращает оверлеям состояние из базы.
export type ClientToServerEvents = {
  'stream:get-system-state': (ack: (state: StreamStatePayload | null) => void) => void;
  'dev:xp-gain': (payload: unknown, ack?: DevAck) => void;
  'dev:level-up': (payload: unknown, ack?: DevAck) => void;
  'dev:chat-message': (payload: unknown, ack?: DevAck) => void;
  'dev:stream-state': (payload: unknown, ack?: DevAck) => void;
  'dev:stream-reset': (ack?: DevAck) => void;
  'dev:follow': (payload: unknown, ack?: DevAck) => void;
  'dev:raid': (payload: unknown, ack?: DevAck) => void;
  'dev:reward-redeem': (payload: unknown, ack?: DevAck) => void;
  'dev:sub': (payload: unknown, ack?: DevAck) => void;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0 && value.length <= 64;

const isInt = (value: unknown, min: number, max = 1_000_000_000): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max;

export const isXpGainPayload = (value: unknown): value is XpGainPayload =>
  isRecord(value) &&
  isNonEmptyString(value.twitchId) &&
  isNonEmptyString(value.username) &&
  isInt(value.amount, 1) &&
  isInt(value.totalXp, 0) &&
  isInt(value.lvl, 1);

export const isLevelUpPayload = (value: unknown): value is LevelUpPayload =>
  isRecord(value) &&
  isNonEmptyString(value.twitchId) &&
  isNonEmptyString(value.username) &&
  isInt(value.fromLvl, 1) &&
  isInt(value.toLvl, 2) &&
  value.toLvl > value.fromLvl;

export const isStreamStatePayload = (value: unknown): value is StreamStatePayload =>
  isRecord(value) &&
  isInt(value.lvl, 1) &&
  isInt(value.newXp, 0) &&
  isInt(value.startXp, 0) &&
  isInt(value.maxXp, 1) &&
  value.maxXp > value.startXp;

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

// Порт Socket.io-сервера бота. Один на dev и prod, если не задан SOCKET_PORT:
// чтобы запускать оба окружения на одной машине, разведите порты в .env.*.
export const DEFAULT_SOCKET_PORT = 3002;

export const resolveSocketPort = (raw: string | undefined): number => {
  const port = Number(raw);
  return Number.isInteger(port) && port > 0 && port < 65536 ? port : DEFAULT_SOCKET_PORT;
};
