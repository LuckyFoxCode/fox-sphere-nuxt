export {};
// Каркас бота. Twitch-подключение и бизнес-логика — позже.
const enabled = process.env.BOT_ENABLED === 'true';

if (!enabled) {
  console.log('[bot] BOT_ENABLED != true — бот выключен (так задумано для dev).');
  // Держим процесс живым, чтобы concurrently/watch не считал его упавшим
  setInterval(() => {}, 1 << 30);
} else {
  console.log(`[bot] запущен, база: ${process.env.DATABASE_URL}`);
  await import('./db');
  setInterval(() => {}, 1 << 30);
}
