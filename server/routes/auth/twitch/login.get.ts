// Откройте http://localhost:3001/auth/twitch/login под аккаунтом БОТА.
export default defineEventHandler((event) => startTwitchLogin(event, 'bot'));
