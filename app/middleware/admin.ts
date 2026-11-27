// Переходы внутри админки: без входа показываем /admin/login. Данные защищает сервер (server/api/admin),
// это только чтобы не открывать пустые страницы.
export default defineNuxtRouteMiddleware(async () => {
  try {
    const { login } = await $fetch<{ login: string }>('/api/admin/session');
    useAdminLogin().value = login;
  } catch {
    return navigateTo('/admin/login');
  }
});
