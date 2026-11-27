// Все зрители разом: канал маленький, поиск, сортировку и страницы делает сама страница.
import type { AdminViewers } from '../../../../shared/viewers';

export default defineAdminHandler(async (): Promise<AdminViewers> => {
  const [viewers, followers] = await Promise.all([
    prisma.viewer.findMany({ orderBy: { id: 'asc' } }),
    loadFollowers(),
  ]);
  return { viewers: viewers.map((viewer) => toAdminViewer(viewer, followers)), followersProblem: followers.problem };
});
