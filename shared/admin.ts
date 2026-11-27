// Общее для админки: что бот принимает и отдаёт по внутреннему API (`/internal/*` на порту сокета)
// и что показывает пульт эфира. Вызывает этот API только сервер Nuxt, уже проверив сессию стримера.
import { BOOST_CONFIG } from './economy';
import type { XpBoostPayload } from './events';

export const INTERNAL_PREFIX = '/internal';

// Секрет из .env годится, только если это не заглушка из .env.example и он достаточно длинный
export const SECRET_MIN_LENGTH = 32;
export const isUsableSecret = (value: string | undefined): value is string =>
  typeof value === 'string' && value.length >= SECRET_MIN_LENGTH && !value.startsWith('CHANGE_ME');

export type AdminStreamState = {
  // false — BOT_ENABLED != true: буст и тесты работают, розыгрыш нет
  botEnabled: boolean;
  chatConnected: boolean;
  // false — dev: бот не пишет в чат о бусте
  production: boolean;
  boost: XpBoostPayload | null;
  lottery: {
    running: boolean;
    // false — розыгрыш меняет только базу, VIP на Twitch не трогает (LOTTERY_TWITCH_VIP)
    twitchVip: boolean;
    // Ники держателей билетов
    tickets: string[];
    // Победители последнего розыгрыша (временные VIP). null — идёт розыгрыш: не раскрываем раньше сцены
    winners: string[] | null;
  };
};

// Фолловеры канала из Twitch: для раздела «Зрители»
export type BotFollowers = { followers: { userId: string; followedAt: string }[] };

export type BoostRequest ={ action: 'start'; minutes: number } | { action: 'stop' };

export const parseBoostRequest = (value: unknown): BoostRequest | null => {
  if (typeof value !== 'object' || value === null) return null;
  const { action, minutes } = value as Record<string, unknown>;
  if (action === 'stop') return { action };
  if (action !== 'start' || typeof minutes !== 'number' || !Number.isInteger(minutes)) return null;
  if (minutes < BOOST_CONFIG.MIN_MINUTES || minutes > BOOST_CONFIG.MAX_MINUTES) return null;
  return { action, minutes };
};

// Розыгрыш сбрасывает победителей, билеты и недельный XP, поэтому запрос без явного подтверждения не принимается
export const isLotteryRunRequest = (value: unknown): value is { confirm: true } =>
  typeof value === 'object' && value !== null && (value as Record<string, unknown>).confirm === true;
