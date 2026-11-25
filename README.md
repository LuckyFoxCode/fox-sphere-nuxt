# fox-sphere-nuxt

Twitch-бот и оверлей для OBS: Nuxt 4 + Pinia + Tailwind 4, бот на Node + TypeScript, Prisma + SQLite (драйвер libSQL, без компиляции).
Без Docker, работает на Windows и Mac. Сейчас есть вход через Twitch, чат, XP за сообщения и первый виджет оверлея (XP-полоска и level-up) на Socket.io.

## Структура

```
app/        Nuxt: pages, stores (Pinia); /overlay — страница для OBS (прозрачный фон, ssr: false)
server/     Nitro: вход через Twitch (OAuth)
bot/        бот (отдельный pnpm-пакет)
shared/     общий код бота и Nuxt
prisma/     schema.prisma (SQLite)
data/       dev.db / prod.db (в .gitignore)
scripts/    вспомогательные скрипты
```

## Быстрый старт

Нужны Node 22+ и pnpm 10.

```bash
pnpm install
cp .env.example .env.development   # заполнить
cp .env.example .env.production     # заполнить: порт 3000, prod.db, BOT_ENABLED=true
pnpm db:push:dev                    # создать data/dev.db
pnpm dev
```

(Windows PowerShell: `Copy-Item .env.example .env.development`.)

## Окружения

| | dev | prod |
|---|---|---|
| env-файл | `.env.development` | `.env.production` |
| порт Nuxt | 3001 | 3000 |
| база | `data/dev.db` | `data/prod.db` |
| бот | **выключен** (`BOT_ENABLED=false`) | включён |
| префикс команд | `!t` (`!tcoins`, `!tprofile`) | `!` |

Бот в dev по умолчанию выключен, чтобы не отвечать в чат дважды. Чтобы включить — `BOT_ENABLED=true` в `.env.development`.
Оверлей: `http://localhost:3001/overlay` (dev), `http://localhost:3000/overlay` (prod).

## Скрипты

- `pnpm dev` — Nuxt и бот вместе (concurrently)
- `pnpm build` — сборка Nuxt с `.env.production`
- `pnpm start` — Nuxt (`.output`) и бот в prod-режиме
- `pnpm db:push:dev` / `pnpm db:push:prod` — применить схему Prisma к нужной базе
- `pnpm db:copy-prod-to-dev` — скопировать `data/prod.db` в `data/dev.db`
- `pnpm prisma:generate` — сгенерировать клиент Prisma (в `generated/`, в git не попадает)

## База данных и драйвер

SQLite подключается через `@prisma/adapter-libsql` (внутри — `@libsql/client` с готовыми бинарниками для Windows/Mac/Linux). Он **не требует компиляции**: Python, Visual Studio Build Tools и node-gyp не нужны. Раньше был `better-sqlite3`, который собирался из исходников и падал на Windows без Build Tools — его в проекте больше нет.

- `DATABASE_URL` — путь к файлу в формате `file:./data/dev.db` (относительно корня репозитория).
- `prisma db push` и `prisma generate` драйвер не используют (у Prisma свой движок), поэтому `db:push:*` работают без адаптера.
- Адаптер подключается в `bot/src/db.ts`; для Nuxt-сервера (Nitro) используй тот же `PrismaLibSql`.
- В `package.json` в `pnpm.ignoredBuiltDependencies` стоит `better-sqlite3`: Nuxt (через db0) тянет его как необязательную зависимость, но pnpm не запускает его сборку.

SQLite открывается из двух процессов (Nuxt и бот), поэтому бот включает `PRAGMA journal_mode=WAL`.
Секреты не коммитятся: в git только `.env.example`.

## Оверлей и Socket.io

Сервер Socket.io живёт в боте (`bot/src/socket.ts`, встроенный HTTP Node, без Express) и стартует всегда, даже при `BOT_ENABLED=false`. Порт — `SOCKET_PORT` (по умолчанию 3002; Nuxt и бот читают одну переменную). По умолчанию слушает только `127.0.0.1`. Бот шлёт события при начислении XP и повышении уровня; контракты — `shared/events.ts`:

| Событие | Когда | Payload |
|---|---|---|
| `xp:gain` | зритель получил XP за сообщение | `twitchId, username, amount, totalXp, lvl` (lvl — до начисления) |
| `level:up` | зритель перешёл на новый уровень | `twitchId, username, fromLvl, toLvl` |

Клиент — плагин `app/plugins/socket.client.ts` (автопереподключение каждые 1–5 с без лимита), состояние виджета — Pinia-стор `app/stores/xp.ts`.

### Добавить виджет в OBS

1. Запустите `pnpm dev` (dev) или `pnpm start` (prod).
2. В OBS: Источники → «+» → **Браузер**. URL: `http://localhost:3001/overlay/xp` (prod: `http://localhost:3000/overlay/xp`).
3. Ширина **1920**, высота **1080**. Фон прозрачный, свой CSS добавлять не нужно. Галочку «Выключать источник, когда не отображается» лучше снять.
4. XP-карточка появляется справа сверху при каждом начислении XP и пропадает через 6 с; level-up — наклейка снизу по центру на 7 с.
5. Если виджет не реагирует: нажмите «Обновить кэш текущей страницы» в свойствах источника и проверьте, что бот запущен и `http://localhost:3002/health` отвечает `ok`.

### Проверка без чата (эмулятор)

Откройте `http://localhost:3001/dev/events` (бот при этом должен работать, `BOT_ENABLED=false` подходит). Кнопки «+XP», «Только level up», «+XP и level up» и «Серия» шлют события на сервер, он рассылает их оверлеям, а справа в окне видно превью `/overlay/xp` на шахматном фоне. Те же события увидит и источник в OBS. В prod эмулятор выключен (`NODE_ENV=production`; принудительно — `DEV_EVENTS=true/false`).

## Вход через Twitch (два аккаунта)

- Бот: `http://localhost:3001/auth/twitch/login` (аккаунт бота; если бот — ваш основной аккаунт, это тот же вход).
- Стример: `http://localhost:3001/auth/twitch/broadcaster/login` (нужен `TWITCH_USER_ID`). Права: `shared/twitch.ts`.
- Оба входа используют один Redirect URL `http://localhost:3001/auth/twitch/callback`. Права запрашиваются в ссылке авторизации, в консоли dev.twitch.tv их настраивать не нужно.
- Один аккаунт = одна строка `TwitchToken`. Если бот и стример — один аккаунт (`TWITCH_BOT_ID` пуст или равен `TWITCH_USER_ID`), оба входа просят права обеих ролей.
