// Сессия админки: зашифрованная cookie (h3), пускают только стримера. Twitch ID сверяется на каждом
// запросе, а не только при входе: смените ID или ADMIN_SESSION_SECRET — старые сессии перестанут работать.
import type { H3Event } from 'h3';
import { isUsableSecret } from '../../shared/admin';

const MAX_AGE_SECONDS = 7 * 24 * 3600;

export type AdminUser = { twitchId: string; login: string };

export const allowedAdminId = (): string => process.env.ADMIN_TWITCH_USER_ID || process.env.TWITCH_USER_ID || '';

// null — в .env не хватает того, без чего вход невозможен
const sessionConfig = () => {
  const password = process.env.ADMIN_SESSION_SECRET;
  if (!isUsableSecret(password) || !allowedAdminId()) return null;
  // Cookie на localhost общие для всех портов: имя с портом не даёт dev и prod выбивать друг друга
  const port = process.env.NITRO_PORT || process.env.PORT || '3000';
  return {
    name: `fox_admin_${port}`,
    password,
    maxAge: MAX_AGE_SECONDS,
    sessionHeader: false as const,
    // secure: false — админка открывается по http://localhost
    cookie: { httpOnly: true, sameSite: 'lax' as const, secure: false, path: '/' },
  };
};

export const isAdminConfigured = (): boolean => sessionConfig() !== null;

export const getAdmin = async (event: H3Event): Promise<AdminUser | null> => {
  const config = sessionConfig();
  if (!config) return null;
  // Читаем cookie сами: useSession завёл бы новую сессию каждому гостю
  const sealed = getCookie(event, config.name);
  if (!sealed) return null;
  try {
    const { data } = await unsealSession(event, config, sealed);
    const { twitchId, login } = (data ?? {}) as Partial<AdminUser>;
    return twitchId === allowedAdminId() && login ? { twitchId, login } : null;
  } catch {
    // Просрочена, подделана или зашифрована другим секретом
    return null;
  }
};

export const createAdminSession = async (event: H3Event, user: AdminUser): Promise<void> => {
  const config = sessionConfig();
  if (!config) throw createError({ statusCode: 503, statusMessage: 'Admin is not configured' });
  const session = await useSession<AdminUser>(event, config);
  await session.update(user);
};

export const destroyAdminSession = async (event: H3Event): Promise<void> => {
  const config = sessionConfig();
  if (config) await clearSession(event, config);
};

// Изменяющий запрос должен прийти со страницы этого же сайта: cookie с SameSite=Lax не защищает
// от другой программы на соседнем порту localhost
const isSameOrigin = (event: H3Event): boolean => {
  const origin = getRequestHeader(event, 'origin');
  const host = getRequestHeader(event, 'host');
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
};

export const requireAdmin = async (event: H3Event): Promise<AdminUser> => {
  const admin = await getAdmin(event);
  if (!admin) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
  if (event.method !== 'GET' && event.method !== 'HEAD' && !isSameOrigin(event)) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden origin' });
  }
  return admin;
};

// Каждый обработчик в server/api/admin/ объявляется через эту обёртку
export const defineAdminHandler = <T>(handler: (event: H3Event, admin: AdminUser) => T | Promise<T>) =>
  defineEventHandler(async (event) => {
    const admin = await requireAdmin(event);
    setHeader(event, 'cache-control', 'no-store');
    return await handler(event, admin);
  });
