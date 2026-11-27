// Вход в админку под аккаунтом СТРИМЕРА. Прав у Twitch не просит и токен в базу не сохраняет.
// Возвращается на тот же Redirect URL, что и входы бота и стримера (callback.get.ts).
export default defineEventHandler((event) => {
  if (!isAdminConfigured()) return sendRedirect(event, '/admin/login?error=setup');
  return startTwitchLogin(event, 'admin');
});
