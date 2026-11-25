# fox-sphere-nuxt

Twitch-бот и оверлей для OBS: Nuxt 4 + Pinia + Tailwind 4, бот на Node + TypeScript, Prisma + SQLite (драйвер libSQL, без компиляции).
Без Docker, работает на Windows и Mac. Сейчас здесь только каркас — без бизнес-логики и Twitch-подключения.

## Структура

```
app/        Nuxt: pages, stores (Pinia); /overlay — страница для OBS (прозрачный фон, ssr: false)
server/     Nitro (позже: Socket.io)
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
