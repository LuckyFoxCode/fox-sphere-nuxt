# Спецификация нового проекта (один канал, Nuxt 4 + SQLite)

Основано на чтении репозитория fox-sphere (только чтение, секреты не открывались).
Важное: **в текущей схеме нет таблицы ачивок** и нет отдельной таблицы уровней героев сверх `UserHero.level/xp`. «Опыт, уровни, монеты, герои» живут в `ChannelUser`, `UserHero`, истории. Если ачивки были задуманы, их придётся проектировать заново (раздел 1.4).

## 0. Принципы

- Один канал → таблицы `Channel`, `User`/`UserLottery` (legacy) и `channelId` везде **выкидываются**.
- `Viewer` + `ChannelUser` схлопываются в одну таблицу `Viewer`: личность и баланс вместе.
- Настройки (цены, кулдауны, XP) остаются константами в коде/`config.ts`, а не в БД.
- Два окружения = два файла БД: `dev.db` и `prod.db` (`DATABASE_URL=file:./data/dev.db`). Бот и Nuxt читают один и тот же файл своего окружения.
- Бот и Nuxt — **два процесса**, один файл SQLite. Включить WAL (`PRAGMA journal_mode=WAL`), иначе будут `database is locked`.

## 1. Схема Prisma для SQLite

SQLite в Prisma не поддерживает `enum` (в Prisma 7 поддерживает не везде) и `BigInt` в `Json`; enum заменяем строкой + zod-проверкой.

```prisma
generator client { provider = "prisma-client"  output = "../generated/prisma" }
datasource db { provider = "sqlite" }

model Viewer {
  id             Int      @id @default(autoincrement())
  twitchId       String   @unique
  username       String
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  coins          Int      @default(0)
  lvl            Int      @default(1)
  xp             Int      @default(0)
  lastXpAt       DateTime @default(now())
  isMod          Boolean  @default(false)
  isFounder      Boolean  @default(false)
  isSubscriber   Boolean  @default(false)
  isPermanentVip Boolean  @default(false)
  spinsCount     Int      @default(0)
  goldenBeers    Int      @default(0)
  totalWin       Int      @default(0)
  totalLoss      Int      @default(0)
  xpThisWeek     Int      @default(0)
  hasTicket      Boolean  @default(false)
  isLuckyVip     Boolean  @default(false)
  coinHistory    CoinHistory[]
  xpHistory      XpHistory[]
  watchStreaks   WatchStreak[]
  heroes         ViewerHero[]
  @@index([xp])
  @@index([coins])
}

model ViewerHero {            // было UserHero
  id        Int     @id @default(autoincrement())
  viewerId  Int
  heroId    String            // ключ из heroes.json
  isActive  Boolean @default(false)
  level     Int     @default(1)
  xp        Int     @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  viewer    Viewer  @relation(fields: [viewerId], references: [id], onDelete: Cascade)
  @@unique([viewerId, heroId])
}

model CoinHistory {
  id           Int      @id @default(autoincrement())
  viewerId     Int
  amount       Int
  reason       String           // BOSS_REWARD|GIFT|LOTTERY|CHANGE_POINTS|WATCH_STREAK|SPIN|SPIN_PRIZE|JACKPOT|FISH|HERO_PURCHASE
  details      String?
  redemptionId String?  @unique // идемпотентность наград за баллы
  createdAt    DateTime @default(now())
  viewer       Viewer   @relation(fields: [viewerId], references: [id], onDelete: Cascade)
  @@index([viewerId])
  @@index([createdAt])
}

model XpHistory {
  id        Int      @id @default(autoincrement())
  viewerId  Int
  amount    Int
  reason    String
  details   String?
  createdAt DateTime @default(now())
  viewer    Viewer   @relation(fields: [viewerId], references: [id], onDelete: Cascade)
  @@index([viewerId])
}

model WatchStreak {
  id          Int      @id @default(autoincrement())
  viewerId    Int
  streakValue Int
  createdAt   DateTime @default(now())
  viewer      Viewer   @relation(fields: [viewerId], references: [id], onDelete: Cascade)
  @@unique([viewerId, streakValue])
}

model SystemState {            // без изменений, одна строка id=1
  id                Int       @id @default(1)
  streamLevel       Int       @default(1)
  streamCurrentXp   Int       @default(0)
  jackpotTotal      Int       @default(1000)
  xpBoostMultiplier Int       @default(1)
  xpBoostExpiresAt  DateTime?
  timerTitle        String?
  timerColor        String?
  timerEndsAt       DateTime?
  updatedAt         DateTime  @updatedAt
}

model TwitchToken {            // без изменений по смыслу
  twitchUserId        String   @id
  accessToken         String
  refreshToken        String
  expiresIn           Int      @default(0)
  obtainmentTimestamp BigInt   // в SQLite хранится как INTEGER; в JSON не отдавать
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
}
```

### 1.1. Что оставить / выкинуть

| Старая модель | Решение |
|---|---|
| `Channel` | **Выкинуть.** `TWITCH_CHANNEL_NAME` / `TWITCH_USER_ID` — в env |
| `Viewer` + `ChannelUser` | **Слить** в `Viewer` |
| `User`, `UserLottery` | **Выкинуть** (legacy, заморожены, источник устаревших данных) |
| `UserHero` | Оставить как `ViewerHero` |
| `CoinHistory`, `XpHistory`, `WatchStreak` | Оставить, убрать `channelId` |
| `SystemState`, `TwitchToken` | Оставить |
| enum `HistoryReason`, `ChannelStatus` | `HistoryReason` → строка; `ChannelStatus` выкинуть |

### 1.2. Соответствие полей для скрипта импорта из Postgres

**Источник баланса — `ChannelUser`, НЕ `User`.** `User` заморожен и устарел; импорт из него перезапишет живые балансы старыми значениями.

| Откуда (Postgres) | Куда (SQLite) | Примечание |
|---|---|---|
| `Viewer.twitchId` | `Viewer.twitchId` | ключ слияния |
| `Viewer.username` | `Viewer.username` | |
| `Viewer.createdAt/updatedAt` | то же | |
| `ChannelUser.coins, lvl, xp, lastXpAt` | то же | |
| `ChannelUser.isMod, isFounder, isSubscriber, isPermanentVip` | то же | |
| `ChannelUser.spinsCount, goldenBeers, totalWin, totalLoss` | то же | |
| `ChannelUser.xpThisWeek, hasTicket, isLuckyVip` | то же | |
| `ChannelUser.id` | не переносится | связи перестраиваются через `twitchId → новый Viewer.id` |
| `ChannelUser.channelId`, `Viewer.id` (cuid) | отбрасываются | |
| `UserHero.heroId, isActive, level, xp, createdAt` | `ViewerHero.*` | `channelUserId → viewerId` через `twitchId` |
| `UserHero.channelId` | отбрасывается | |
| `CoinHistory.amount, reason, details, redemptionId, createdAt` | то же | `reason` enum → строка |
| `XpHistory.amount, reason, details, createdAt` | то же | |
| `WatchStreak.streakValue, createdAt` | то же | |
| `SystemState.*` | то же | одна строка |
| `TwitchToken.*` | **не импортировать**, пройти OAuth заново | новый токен под новое приложение/окружение |
| `User.*`, `UserLottery.*` | **не импортировать** | |

Алгоритм импорта: выгрузить из Postgres JSON/CSV (`psql \copy` или `pg_dump --data-only`), пройти по `ChannelUser JOIN Viewer`, создать `Viewer`, построить карту `channelUserId → viewerId`, затем перенести 4 зависимые таблицы. После: сравнить `SUM(coins)`, `SUM(xp)`, `COUNT(*)` в обеих БД. Импорт должен быть идемпотентным (`upsert` по `twitchId`).

### 1.3. Герои
Каталог героев — не таблица, а `packages/types/src/hero/heroes.json` (сейчас 3 героя с ценами 0/300/800, спрайты в overlay). Скопировать JSON и спрайты как есть; в БД лежит только `heroId` строкой.

### 1.4. Ачивки
Нет в текущей схеме. Если хочешь — добавить `Achievement { key, viewerId, unlockedAt }` с каталогом в JSON. Решить до шага 4 плана.

## 2. Функции и команды бота

Префикс — `COMMAND_PREFIX`. Кулдауны из `twitch.constants.ts` и модулей.

Ответы бота — на `en` (по умолчанию), `uk` или `ru`: константа `BOT_LANG`, словари в `shared/i18n/`. Новая команда добавляет фразы в словари всех трёх языков. Переключатель в админке — позже.

**Экономика:** `!coins` (5с), `!spin` (цена 100, 10% в джекпот, кулдаун 30с), `!spinstats` (5с), `!fish` (алиасы `!рыбачить`, `!рыбалка`; 60с, поклёвка через 10–30с; веса из 1000: сорвалась 220, 25 монет 300, 70 монет 100, 100 монет 8, 20 XP 250, 40 XP 97, сундук 200 монет в джекпот 25; своего виджета на оверлее нет, на сундук — событие `fishing:chest` и алерт), `!buy`, `!use` (10с, герои), `!shop` (60с).
**Общие:** `!profile`, `!pivo` (60с, золотое пиво), `!points`, `!help`, `!lurk` (5мин), `!version`, `!project`, `!stack`, `!gh`, `!tg` (10с) — последние пять-шесть можно заменить статическим списком «текстовых команд» из конфига.
**Лотерея:** `!ticket`, `!tickets`, `!runlottery` (только стример: 5 победителей, анимация на оверлее, выдача VIP).
**Модерация/стример:** `!addvip`, `!removevip`, `!addfounder`, `!removefounder`, `!xpboost` (5–60 мин, ×2), `!timer`, `!stoptimer`.

**Фоновая логика:**
- XP за сообщение (кулдаун 15с; 1 обычный, 3 саб/стример, 2 фолловер, +1 VIP, +1 founder; аккаунты стримера и бота XP за сообщения не получают), уровни (`getXpThresholdForLevel` в `backend-shared/src/xp.ts`), level-up в чат (на оверлее XP и level-up зрителя не показываются).
- XP стрима (`SystemState.streamLevel/streamCurrentXp`) + авто-буст 30 мин.
- Недельная лотерея: 100 XP за неделю = билет; еженедельный сброс `xpThisWeek/hasTicket`.
- Watch streak: награды на 3, 5, 7, затем каждый 5-й с 10.
- Джекпот (`jackpotTotal`, seed 1000).
- Награды за баллы канала: Flex Leaderboard, Check My Stats, обмен баллов на монеты (Coin Pouch 1000→1000, Coin Chest 3000→3900, Poke Master's Hoard 5000→7500).
- EventSub: follow, raid, redemption; приветствия follow/raid в чат.
- Очередь анонсов (интервал 2с), токен Twitch с автообновлением, роли из бейджей.
- Music: бот сам запускает читателя системного плеера Windows (`bot/src/music/reader.ps1`, дочерний процесс `powershell.exe`) и получает состояние из его stdout. Отдельной программы, планировщика, токена и HTTP-роута нет: бот и плеер на одной машине. Только Windows (на Mac виджет не оживёт); `MUSIC_ENABLED=false` выключает.

Что **не переносить**: multi-tenant заготовки, `channel-context`, backfill-скрипт, `User`-кеши, `/api/internal/events` (в новом проекте бот и Nuxt в одном репо — см. раздел 4).

## 3. Оверлей: виджеты и события Socket.io

Сервер → оверлей:
| Событие | Виджет |
|---|---|
| `chat:message` | чат в сайдбаре |
| `stream:xp-updated`, `stream:level-up`, `stream:xp-boost`, `stream:jackpot-updated` | шапка: уровень стрима, XP-бар, чип ×2, джекпот |
| `roulette:spin-result` | рулетка (лента карточек) |
| `lottery:ticket-earned/started/winner-drawn/finished/participants` | менеджер лотереи |
| `hero:assigned`, `hero:changed` | полоса героев (Phaser-сцена `hero-lane`) |
| `profile:show`, `shop:show` | окна профиля и магазина |
| `twitch:follow`, `twitch:raid`, `twitch:reward-redeem`, `twitch:add-vip`, `twitch:watch-streak`, `twitch:golden-beer` | хаб событий (стикеры) |
| `twitch:timer`, `twitch:timer-stop` | таймер |
| `twitch:watch-streak` | алерт стрика: `{userId, username, streakValue, xpAwarded, coinsAwarded, isRepeat}`; плашка в чате идёт отдельно, полем `watchStreak` в `chat:message` |
| `fishing:chest` | алерты: сундук из рыбалки (новое, в старом проекте не было) |
| `music:now-playing` (`null` = скрыть) | карточка «играет сейчас», скрывается через 45с тишины, отбрасывает payload старше 45с |

Карточку зрителя и level-up (`user:created`, `user:level-up` в старом проекте) в новый оверлей не переносим.

Оверлей → сервер (запрос состояния при подключении): `stream:get-system-state`, `twitch:get-timer`, `music:get-current` (состояние в памяти бота; оверлей отбрасывает старше 45 с).

Правило: в новом проекте **не использовать глобальный `io.emit` для всего подряд** — но каналов нет, поэтому один namespace и все эмитят в него; контракты событий держать в одном файле типов, общем для бота и Nuxt.

## 4. Структура папок

```
my-project/
  package.json              # pnpm workspace: корень = Nuxt, bot/ = пакет
  pnpm-workspace.yaml
  .env.example              # DATABASE_URL, TWITCH_*, ADMIN_*, MUSIC_AGENT_TOKEN
  prisma/
    schema.prisma
    migrations/
  data/                     # dev.db, prod.db (в .gitignore)
  shared/                   # типы событий, zod-схемы, heroes.json, xp.ts, константы
  app/                      # Nuxt 4: pages/, components/, stores/ (Pinia), composables/
    pages/overlay.vue       # OBS-страница
    pages/admin/...         # панель (позже)
  server/                   # Nitro: api/, plugins/socket.ts (Socket.io)
  bot/
    src/main.ts             # старт, EventSub, чат
    src/commands/           # по одному файлу на команду
    src/services/           # xp, roulette, fishing, lottery, hero, streak
    src/db.ts               # один PrismaClient (better-sqlite3 adapter)
  scripts/
    import-from-postgres.ts
```
Связь бот → оверлей: проще всего, чтобы **Socket.io-сервер жил в Nitro** (`server/plugins/socket.ts`), а бот подключался к нему как клиент и слал события (с общим секретом в `auth`). Так нет второго HTTP-порта и неавторизованного `/api/internal/events`.

## 5. Порядок работ

1. Репозиторий, pnpm workspace, Nuxt 4 + Pinia + Tailwind, `.env.example`, `data/` в `.gitignore`.
2. `prisma/schema.prisma`, миграция, `shared/` (типы событий, xp.ts, heroes.json). Два окружения БД.
3. `scripts/import-from-postgres.ts` + проверка сумм. Делать **рано**, пока есть дамп.
4. Бот: подключение к Twitch, токен, чат, XP за сообщения, `!coins`. Решить про ачивки.
5. Socket.io в Nitro + пустой оверлей, событие `chat:message` и `stream:*`.
6. Экономика: `!spin` + рулетка на оверлее, джекпот, `!fish`, `!pivo`.
7. Герои: каталог, `!buy`, `!use`, полоса героев.
8. Лотерея и watch streak, награды за баллы, EventSub (follow/raid).
9. Таймер, XP-буст, музыкальный виджет, оставшиеся мелкие команды.
10. Новый дизайн оверлеев (можно параллельно с 5–9 на моках событий).
11. Админ-панель (по желанию), деплой: два процесса (Nuxt + бот) и prod.db на сервере, бэкап файла БД по cron.
