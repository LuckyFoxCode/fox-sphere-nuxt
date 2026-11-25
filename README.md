# fox-sphere-nuxt

Twitch-бот и оверлей для OBS: Nuxt 4 + Pinia + Tailwind 4, бот на Node + TypeScript, Prisma + SQLite (драйвер libSQL, без компиляции).
Без Docker, работает на Windows и Mac. Сейчас есть вход через Twitch, чат, XP за сообщения и виджеты оверлея на Socket.io: шапка стрима, чат, алерты и рулетка.

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
- `pnpm db:import` — перенести зрителей из дампа Postgres старого fox-sphere (см. ниже)

## Импорт зрителей из старого fox-sphere

Скрипт читает data-only дамп `pg_dump` (по умолчанию `data/prod-pg-dump.sql`) и переносит зрителей, героев, историю монет и XP, watch streak и `SystemState` (соответствие полей — `docs/spec.md`, 1.2). Токены Twitch и legacy-таблицы не переносятся.

```bash
pnpm db:import                          # пробный прогон по dev.db: что изменится и что не сошлось
pnpm db:import --apply                  # записать (перед этим делается копия базы в data/)
pnpm db:import --db data/prod.db        # другая база
pnpm db:import --file data/other.sql    # другой дамп
```

Повторный запуск не дублирует строки. Балансы совпадающих зрителей **перезаписываются** значениями из дампа, поэтому после перехода на нового бота старый дамп накатывать нельзя. На время `--apply` бота этой базы лучше остановить.

## База данных и драйвер

SQLite подключается через `@prisma/adapter-libsql` (внутри — `@libsql/client` с готовыми бинарниками для Windows/Mac/Linux). Он **не требует компиляции**: Python, Visual Studio Build Tools и node-gyp не нужны. Раньше был `better-sqlite3`, который собирался из исходников и падал на Windows без Build Tools — его в проекте больше нет.

- `DATABASE_URL` — путь к файлу в формате `file:./data/dev.db` (относительно корня репозитория).
- `prisma db push` и `prisma generate` драйвер не используют (у Prisma свой движок), поэтому `db:push:*` работают без адаптера.
- Адаптер подключается в `bot/src/db.ts`; для Nuxt-сервера (Nitro) используй тот же `PrismaLibSql`.
- В `package.json` в `pnpm.ignoredBuiltDependencies` стоит `better-sqlite3`: Nuxt (через db0) тянет его как необязательную зависимость, но pnpm не запускает его сборку.

SQLite открывается из двух процессов (Nuxt и бот), поэтому бот включает `PRAGMA journal_mode=WAL`.
Секреты не коммитятся: в git только `.env.example`.

## Оверлей и Socket.io

Сервер Socket.io живёт в боте (`bot/src/socket.ts`, встроенный HTTP Node, без Express) и стартует всегда, даже при `BOT_ENABLED=false`. Порт — `SOCKET_PORT` (по умолчанию 3002; Nuxt и бот читают одну переменную). По умолчанию слушает только `127.0.0.1`. Контракты событий — `shared/events.ts`:

| Событие | Когда | Payload |
|---|---|---|
| `stream:xp-updated` | стрим получил XP | `lvl, newXp, maxXp, startXp` |
| `twitch:follow` | новый фолловер | `userId, username` |
| `twitch:raid` | канал рейдят | `raiderId, raiderName, viewers` |
| `twitch:reward-redeem` | активирована награда за баллы | `userId, username, rewardTitle, redemptionId` |
| `twitch:sub` | подписка, resub или подарок | `kind, username, tier` + `userId`, `months` или `amount` |
| `roulette:spin-result` | началось вращение рулетки | `userId, username, prizeType, coinAmount, xpAmount, jackpotWon, jackpotTotalAfter` |
| `stream:jackpot-updated` | лента остановилась или банк пополнен | `jackpotTotal` |

При каждом подключении оверлей запрашивает текущее состояние стрима (`stream:get-system-state`). Весь XP, который зритель получил за сообщение, прибавляется и стриму (`SystemState`, `bot/src/stream.ts`); порог уровня `lvl` стрима — `1000 × (1 + 2 + … + lvl)`. О новом уровне стрима prod-бот пишет в чат, dev-бот только в лог. Буста XP пока нет.

XP и уровень зрителя бот хранит в базе и пишет о новом уровне в чат; отдельного виджета для них на оверлее нет.

Клиент — плагин `app/plugins/socket.client.ts` (автопереподключение каждые 1–5 с без лимита), состояние виджетов — Pinia-сторы `app/stores/`.

### Добавить виджет в OBS

Все оверлеи с адресами (кнопка «Скопировать») и размерами собраны на главной: `http://localhost:3001/` (prod: порт 3000). Новый виджет добавляется в список `app/utils/overlays.ts`.

1. Запустите `pnpm dev` (dev) или `pnpm start` (prod).
2. В OBS: Источники → «+» → **Браузер**. URL шапки стрима: `http://localhost:3001/overlay/stream` (prod: `http://localhost:3000/overlay/stream`). Банк рулетки, уровень и XP стрима стоят справа сверху и видны постоянно.
3. Ширина **1920**, высота **1080**. Фон прозрачный, свой CSS добавлять не нужно. Галочку «Выключать источник, когда не отображается» лучше снять.
4. Чат: второй источник «Браузер» с URL `http://localhost:3001/overlay/chat` (prod: порт 3000), 1920×1080, тот же прозрачный фон. Колонка 400 px слева внизу: до 5 сообщений, каждое живёт 18 с. Настоящие сообщения приходят от бота как событие `chat:message`.
5. Алерты: источник с URL `http://localhost:3001/overlay/alerts` (prod: порт 3000), 1920×1080. Follow, рейд, награда за баллы и подписки показываются по одному снизу по центру на 5 с, со звуком (`public/assets/sound/`). Чтобы звук шёл в микшер OBS и там регулировалась громкость, включите в свойствах источника «Управление аудио через OBS».
6. Рулетка: источник с URL `http://localhost:3001/overlay/roulette` (prod: порт 3000), 1920×1080. Лента по центру появляется на каждое вращение, на джекпоте — экран на весь кадр со звуком `jackpot.mp3` (включите «Управление аудио через OBS»). Превью всех карточек: `/dev/roulette`.
7. Если виджет не реагирует: нажмите «Обновить кэш текущей страницы» в свойствах источника и проверьте, что бот запущен и `http://localhost:3002/health` отвечает `ok`.

### Проверка без чата (эмулятор)

Откройте `http://localhost:3001/dev/events` (бот при этом должен работать, `BOT_ENABLED=false` подходит). Кнопки шлют события на сервер, он рассылает их оверлеям, а справа в окне видно превью `/overlay/stream`, `/overlay/roulette`, `/overlay/chat` или `/overlay/alerts` (переключатель над превью) на шахматном фоне. В колонке «Алерты» есть кнопки follow, рейда, награды, подписки, resub, подарка (в том числе анонимного) и «Все подряд» для проверки очереди. Для шапки есть «Добавить XP стрима», «Повысить уровень стрима» и «Вернуть значения из базы»; в базу эмулятор ничего не пишет. Для чата есть форма сообщения (ник, цвет, уровень, роли, announcement, watch streak) и кнопки «по сообщению от каждой роли», «семь подряд» и «ссылка и длинное слово». В колонке «Рулетка» можно запустить вращение с выбранным призом, джекпот, случайный слот или три подряд, а также поменять банк в шапке и вернуть значение из базы. Те же события увидит и источник в OBS. В prod эмулятор выключен (`NODE_ENV=production`; принудительно — `DEV_EVENTS=true/false`).

## Рулетка и банк

`!spin` (алиасы `!roll`, `!спин`, `!лудка`; в dev с префиксом `!t`: `!tspin`) стоит 100 монет, кулдаун 30 с на зрителя. 10 монет с каждого спина уходят в банк (`SystemState.jackpotTotal`), после джекпота банк начинается с 1000. `!spinstats` — статистика зрителя. Цены, веса и тайминги — `shared/roulette.ts`, спин в базе — `bot/src/roulette.ts`, пополнение банка из других игр — `addToBank` в `bot/src/bank.ts`.

Вращения идут по очереди: следующее начинается, когда оверлей убрал предыдущее. Ответ в чат, новый банк и XP-приз показываются в момент остановки ленты.

## Вход через Twitch (два аккаунта)

- Бот: `http://localhost:3001/auth/twitch/login` (аккаунт бота; если бот — ваш основной аккаунт, это тот же вход).
- Стример: `http://localhost:3001/auth/twitch/broadcaster/login` (нужен `TWITCH_USER_ID`). Права: `shared/twitch.ts`.
- Оба входа используют один Redirect URL `http://localhost:3001/auth/twitch/callback`. Права запрашиваются в ссылке авторизации, в консоли dev.twitch.tv их настраивать не нужно.
- Один аккаунт = одна строка `TwitchToken`. Если бот и стример — один аккаунт (`TWITCH_BOT_ID` пуст или равен `TWITCH_USER_ID`), оба входа просят права обеих ролей.

## Анонсы и шаутауты

Бот отправляет их через Helix от своего аккаунта (`bot/src/announcements.ts`), в канал `TWITCH_USER_ID`. Без этой переменной они выключены.

Настройка:

1. **Остановите бота и войдите заново.** Токен, выданный раньше, новых прав не получает. Для входа нужен только сайт: `pnpm dev:web` (dev) или `pnpm build`, затем `pnpm start:web` (prod, порт 3000).
   - под аккаунтом бота: `/auth/twitch/login` (права `moderator:manage:announcements`, `moderator:manage:shoutouts`, `user:bot`);
   - под аккаунтом стримера: `/auth/twitch/broadcaster/login` (`channel:bot`);
   - если бот и стример — один аккаунт, достаточно любого из двух входов.
2. **Сделайте бота модератором**: в чате канала `/mod <ник бота>` от имени стримера (для одного аккаунта не нужно).
3. Запустите бота. У dev и prod разные базы, поэтому вход нужен в каждом окружении.

Если в логе бота отказ: `403` — бот не модератор (`/mod`); `401` или сообщение о недостающем scope — вход не повторён или бот не перезапущен после него; `429` — лимит Twitch (шаутаут раз в 2 минуты, одному каналу раз в час); `400` на шаутауте — обычно стрим не идёт или на нём нет зрителей.

**Follow, награды и подписки** бот получает по EventSub вместе с рейдами (`bot/src/eventsub.ts`, токен стримера) и показывает в алертах. За follow prod-бот благодарит в чате, dev-бот только пишет в лог. Если в логе `подписка не создана`, войдите заново под стримером.

**Рейды.** Когда канал рейдят, prod-бот шлёт фиолетовый анонс и шаутаут рейдеру (нужен токен стримера). Dev-бот только пишет рейд в лог, чтобы не дублировать боевого. По той же причине при переходе на этот бот старый нужно выключить.
