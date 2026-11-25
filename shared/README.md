Общий код бота и Nuxt: типы событий, heroes.json, xp.ts, константы.

- `events.ts` — контракты Socket.io (`chat:message`, `stream:*`, `twitch:*`, `roulette:*`, эмуляторные `dev:*`), проверки payload и порт сервера.
- `xp.ts`, `economy.ts`, `twitch.ts` — формула уровней, константы экономики, права Twitch.
- `roulette.ts`, `fishing.ts` — веса, призы, тайминги (у рыбалки и тексты); бот и эмулятор берут их отсюда.
