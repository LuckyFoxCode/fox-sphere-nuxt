// Язык ответов бота. Бот перечитывает его раз в несколько секунд, отдельно сообщать ему не нужно.
import { isLang } from '../../../../shared/i18n';

export default defineAdminHandler(async (event) => {
  const botLang = (await readBody<{ botLang?: unknown } | null>(event))?.botLang;
  if (!isLang(botLang)) {
    throw createError({ statusCode: 400, statusMessage: 'Bad language', data: { error: 'Такого языка нет.' } });
  }
  await setBotLang(botLang);
  return { ok: true };
});
