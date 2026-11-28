// Настройки из базы и состояние входов Twitch для админки. Сами токены наружу не отдаются.
import { toLang, type Lang } from '../../shared/i18n';
import type { AdminAccount } from '../../shared/settings';
import { isSameAccount } from '../../shared/twitch';
import { parseSeasonsJson, type SeasonStates, type SeasonUpdate } from '../../shared/seasons';
import { parseWidgetsJson, type WidgetId, type WidgetStates } from '../../shared/widgets';

const STATE_ID = 1;

export const getBotLang = async (): Promise<Lang> => {
  const row = await prisma.systemState.findUnique({ where: { id: STATE_ID }, select: { botLang: true } });
  return toLang(row?.botLang);
};

export const setBotLang = async (botLang: Lang): Promise<void> => {
  await prisma.systemState.upsert({ where: { id: STATE_ID }, create: { id: STATE_ID, botLang }, update: { botLang } });
};

// Какой аккаунт под какую роль — решается так же, как при входе и в боте (bot/src/auth.ts)
export const getTwitchAccounts = async (): Promise<AdminAccount[]> => {
  const botId = process.env.TWITCH_BOT_ID ?? '';
  const userId = process.env.TWITCH_USER_ID ?? '';
  const saved = await prisma.twitchToken.findMany({ select: { twitchUserId: true, updatedAt: true } });

  const account = (role: AdminAccount['role'], id: string): AdminAccount => {
    // Без обоих id бот берёт единственный токен из таблицы
    const row = id ? saved.find((item) => item.twitchUserId === id) : saved[0];
    return { role, authorized: row !== undefined, updatedAt: row?.updatedAt.toISOString() ?? null };
  };

  if (isSameAccount(botId, userId)) return [account('both', userId)];
  return [account('bot', botId || userId), account('broadcaster', userId)];
};

export const getWidgets = async (): Promise<WidgetStates> => {
  const row = await prisma.systemState.findUnique({ where: { id: STATE_ID }, select: { widgets: true } });
  return parseWidgetsJson(row?.widgets);
};

// Читаем и пишем в одной транзакции, чтобы два быстрых щелчка не затёрли друг друга
export const setWidget = async (id: WidgetId, enabled: boolean): Promise<WidgetStates> =>
  prisma.$transaction(async (tx) => {
    const row = await tx.systemState.findUnique({ where: { id: STATE_ID }, select: { widgets: true } });
    const next = { ...parseWidgetsJson(row?.widgets), [id]: enabled };
    const widgets = JSON.stringify(next);
    await tx.systemState.upsert({ where: { id: STATE_ID }, create: { id: STATE_ID, widgets }, update: { widgets } });
    return next;
  });

export const getSeasons = async (): Promise<SeasonStates> => {
  const row = await prisma.systemState.findUnique({ where: { id: STATE_ID }, select: { seasons: true } });
  return parseSeasonsJson(row?.seasons);
};

// Как и у виджетов: чтение и запись в одной транзакции
export const setSeason = async ({ id, mode, intensity }: SeasonUpdate): Promise<SeasonStates> =>
  prisma.$transaction(async (tx) => {
    const row = await tx.systemState.findUnique({ where: { id: STATE_ID }, select: { seasons: true } });
    const current = parseSeasonsJson(row?.seasons);
    const next = { ...current, [id]: { ...current[id], ...(mode && { mode }), ...(intensity && { intensity }) } };
    const seasons = JSON.stringify(next);
    await tx.systemState.upsert({ where: { id: STATE_ID }, create: { id: STATE_ID, seasons }, update: { seasons } });
    return next;
  });
