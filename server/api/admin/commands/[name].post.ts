// Правка текстовой команды: переключатель и/или ответы на всех языках. Новые команды здесь не создаются.
// Бот перечитывает таблицу не чаще раза в 30 с, отдельно сообщать ему не нужно.
import { parseTextCommandUpdate } from '../../../../shared/commands';
import { LANGS } from '../../../../shared/i18n';

export default defineAdminHandler(async (event) => {
  const name = getRouterParam(event, 'name', { decode: true }) ?? '';
  const parsed = parseTextCommandUpdate(await readBody(event), commandPrefix());
  if (!parsed.ok) {
    throw createError({ statusCode: 400, statusMessage: 'Bad command update', data: { error: parsed.error } });
  }

  const rows = await prisma.textCommand.findMany({ where: { name } });
  const base = rows.find((row) => row.lang === 'en') ?? rows[0];
  if (!base) {
    throw createError({ statusCode: 404, statusMessage: 'Unknown command', data: { error: 'Такой команды нет.' } });
  }

  const { enabled, responses } = parsed.update;
  if (!responses) {
    await prisma.textCommand.updateMany({ where: { name }, data: { enabled } });
    return { ok: true };
  }

  // Строки на языке в базе может ещё не быть: она заводится с настройками английской
  await prisma.$transaction(
    LANGS.map((lang) =>
      prisma.textCommand.upsert({
        where: { name_lang: { name, lang } },
        update: { responses: responses[lang], enabled },
        create: {
          name,
          lang,
          responses: responses[lang],
          aliases: stringList(base.aliases),
          enabled: enabled ?? base.enabled,
          cooldownMs: base.cooldownMs,
          scope: base.scope,
        },
      }),
    ),
  );
  return { ok: true };
});
