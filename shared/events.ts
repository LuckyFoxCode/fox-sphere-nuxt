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

// Сервер → оверлей
export type ServerToClientEvents = {
  'xp:gain': (payload: XpGainPayload) => void;
  'level:up': (payload: LevelUpPayload) => void;
};

export type DevAck = (result: { ok: boolean; reason?: string }) => void;

// Оверлей → сервер. Принимаются только эмулятором (/dev/events) и только при DEV_EVENTS=true:
// сервер проверяет payload и рассылает его всем оверлеям, как будто событие прислал бот.
export type ClientToServerEvents = {
  'dev:xp-gain': (payload: unknown, ack?: DevAck) => void;
  'dev:level-up': (payload: unknown, ack?: DevAck) => void;
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

// Порт Socket.io-сервера бота. Один на dev и prod, если не задан SOCKET_PORT:
// чтобы запускать оба окружения на одной машине, разведите порты в .env.*.
export const DEFAULT_SOCKET_PORT = 3002;

export const resolveSocketPort = (raw: string | undefined): number => {
  const port = Number(raw);
  return Number.isInteger(port) && port > 0 && port < 65536 ? port : DEFAULT_SOCKET_PORT;
};
