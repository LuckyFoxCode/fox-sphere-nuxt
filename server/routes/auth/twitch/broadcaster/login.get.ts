// Откройте http://localhost:3001/auth/twitch/broadcaster/login под аккаунтом СТРИМЕРА.
// Redirect URL тот же, что у входа бота.
export default defineEventHandler((event) => startTwitchLogin(event, 'broadcaster'));
