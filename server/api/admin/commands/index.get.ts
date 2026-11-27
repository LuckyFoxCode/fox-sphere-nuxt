import type { AdminCommands } from '../../../../shared/commands';
import { BOT_LANG } from '../../../../shared/i18n';

export default defineAdminHandler(async (): Promise<AdminCommands> => {
  const rows = await prisma.textCommand.findMany({ orderBy: [{ name: 'asc' }, { lang: 'asc' }] });
  const byName = Map.groupBy(rows, (row) => row.name);
  return { prefix: commandPrefix(), botLang: BOT_LANG, text: [...byName.values()].map(toAdminCommand) };
});
