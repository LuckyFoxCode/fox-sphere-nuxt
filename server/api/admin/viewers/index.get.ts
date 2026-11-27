// Все зрители разом: канал маленький, поиск, сортировку и страницы делает сама страница.
import type { AdminViewer } from '../../../../shared/viewers';

export default defineAdminHandler(async (): Promise<AdminViewer[]> => {
  const viewers = await prisma.viewer.findMany({ orderBy: { id: 'asc' } });
  return viewers.map(toAdminViewer);
});
