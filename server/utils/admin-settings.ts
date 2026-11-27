// Настройки из базы и состояние входов Twitch для админки. Сами токены наружу не отдаются.
import { toLang, type Lang } from '../../shared/i18n';
import type { AdminAccount } from '../../shared/settings';
import { isSameAccount } from '../../shared/twitch';

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
