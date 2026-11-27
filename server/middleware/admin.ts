// Защита админки на сервере: страницы без входа уходят на /admin/login, API отвечает 401.
// Обработчики API проверяют сессию и сами (defineAdminHandler): это второй рубеж, а не единственный.
export default defineEventHandler(async (event) => {
  // Роутер страниц не различает регистр, поэтому и здесь /Admin — то же, что /admin
  const path = (event.path.split('?')[0] ?? '').toLowerCase().replace(/\/+$/, '');

  if (path.startsWith('/api/admin/')) {
    await requireAdmin(event);
    return;
  }
  if (path !== '/admin' && !path.startsWith('/admin/')) return;

  // Страницу админки нельзя встроить во фрейм и подсунуть под чужие кнопки
  setHeader(event, 'x-frame-options', 'DENY');
  setHeader(event, 'cache-control', 'no-store');
  if (path !== '/admin/login' && !(await getAdmin(event))) return sendRedirect(event, '/admin/login');
});
