Общий код бота и Nuxt: типы событий, heroes.json, xp.ts, константы.

- `events.ts` — контракты Socket.io (`chat:message`, `stream:*`, `twitch:*`, `roulette:*`, эмуляторные `dev:*`), проверки payload и порт сервера.
- `xp.ts`, `economy.ts`, `twitch.ts` — формула уровней, константы экономики, права Twitch.
- `roulette.ts`, `fishing.ts`, `pivo.ts` — веса, призы, тайминги; бот и эмулятор берут их отсюда.
- `i18n/` — все фразы бота в чате на `en` (по умолчанию), `uk` и `ru`, настройка `BOT_LANG`.
