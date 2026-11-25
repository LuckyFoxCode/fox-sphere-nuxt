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

// Сервер → оверлей
export type ServerToClientEvents = {
  'xp:gain': (payload: XpGainPayload) => void;
  'level:up': (payload: LevelUpPayload) => void;
  'chat:message': (payload: ChatMessagePayload) => void;
};

export type DevAck = (result: { ok: boolean; reason?: string }) => void;

// Оверлей → сервер. Принимаются только эмулятором (/dev/events) и только при DEV_EVENTS=true:
// сервер проверяет payload и рассылает его всем оверлеям, как будто событие прислал бот.
export type ClientToServerEvents = {
  'dev:xp-gain': (payload: unknown, ack?: DevAck) => void;
  'dev:level-up': (payload: unknown, ack?: DevAck) => void;
  'dev:chat-message': (payload: unknown, ack?: DevAck) => void;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0 && value.length <= 64;

const isInt = (value: unknown, min: number): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= min && value <= 1_000_000_000;

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
  if (!isStringArray(value.badges, 10) || !isInt(value.timestamp, 0) || !isInt(value.userLvl, 1)) return false;
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

// Порт Socket.io-сервера бота. Один на dev и prod, если не задан SOCKET_PORT:
// чтобы запускать оба окружения на одной машине, разведите порты в .env.*.
export const DEFAULT_SOCKET_PORT = 3002;

export const resolveSocketPort = (raw: string | undefined): number => {
  const port = Number(raw);
  return Number.isInteger(port) && port > 0 && port < 65536 ? port : DEFAULT_SOCKET_PORT;
};
