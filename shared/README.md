Общий код бота и Nuxt: типы событий, heroes.json, xp.ts, константы.

- `events.ts` — контракты Socket.io (`xp:gain`, `level:up`, `chat:message`, `stream:*`, эмуляторные `dev:*`), проверки payload и порт сервера.
- `xp.ts`, `economy.ts`, `twitch.ts` — формула уровней, константы экономики, права Twitch.
