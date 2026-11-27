import type { AdminCommands } from '../../../../shared/commands';

export default defineAdminHandler(async (): Promise<AdminCommands> => {
  const [rows, botLang] = await Promise.all([
    prisma.textCommand.findMany({ orderBy: [{ name: 'asc' }, { lang: 'asc' }] }),
    getBotLang(),
  ]);
  const byName = Map.groupBy(rows, (row) => row.name);
  return { prefix: commandPrefix(), botLang, text: [...byName.values()].map((group) => toAdminCommand(group, botLang)) };
});
