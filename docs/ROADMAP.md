# ROADMAP — перенос функций старого fox-sphere

Источник списка: [`spec.md`](spec.md). Дизайн: [`DESIGN.md`](DESIGN.md).
Статусы: ✅ сделано · ⬜ не начато · ❓ открытый вопрос.

## Порядок переноса

1. Бот и Twitch
2. Чат и первый виджет
3. Экономика и XP
4. Импорт данных
5. Игры по одной: лотерея, рулетка, рыбалка, pivo, герои и магазин
6. Админка

(Импорт из Postgres лучше не откладывать надолго, пока есть дамп: можно сделать сразу после схемы, но реальные балансы нужны только с этапа экономики.)

## Каркас

- ✅ Репозиторий, pnpm workspace, Nuxt 4 + Pinia + Tailwind 4
- ✅ Prisma 7 + SQLite (libsql), окружения dev/prod, `data/` в `.gitignore`
- ✅ Заготовки `bot/`, страницы `/` и `/overlay`
- ⬜ Полная схема из spec.md (сейчас только каркас), `shared/` (типы событий, `xp.ts`, `heroes.json`)

## 1. Бот и Twitch

- ⬜ Подключение к Twitch, токен с автообновлением (`TwitchToken`, OAuth заново)
- ⬜ Чат, роли из бейджей, очередь анонсов (интервал 2 с)
- ⬜ EventSub: follow, raid, redemption; приветствия в чат
- ⬜ Простые команды: `!help`, `!lurk`, `!version`, текстовые (`!project`, `!stack`, `!gh`, `!tg`) списком из конфига
- ⬜ Socket.io в Nitro, бот как клиент с секретом

## 2. Чат и первый виджет

- ⬜ `chat:message` → чат в сайдбаре оверлея (бумага)
- ⬜ Оболочки наклеек: `StickerFrame`, `PaperFrame`, `EventSticker`, токены и шрифты
- ⬜ `stream:*` и шапка (XP-бар, уровень стрима)

## 3. Экономика и XP

- ⬜ XP за сообщения (кулдаун 15 с), уровни, level-up в чат и на оверлей
- ⬜ `!coins`, `!profile`, `!points`, карточка профиля
- ⬜ XP стрима, авто-буст 30 мин, `!xpboost`, чип ×2
- ⬜ Награды за баллы канала (Flex Leaderboard, Check My Stats, обмен на монеты)
- ⬜ Watch streak (награды на 3, 5, 7, затем каждый 5-й с 10)
- ⬜ Модерация: `!addvip`, `!removevip`, `!addfounder`, `!removefounder`
- ⬜ Таймер: `!timer`, `!stoptimer`

## 4. Импорт данных

- ⬜ `scripts/import-from-postgres.ts`: `ChannelUser` + `Viewer` → `Viewer`, затем `ViewerHero`, `CoinHistory`, `XpHistory`, `WatchStreak`, `SystemState`
- ⬜ Источник баланса — `ChannelUser`, **не** `User`
- ⬜ Идемпотентность (`upsert` по `twitchId`), сверка `SUM(coins)`, `SUM(xp)`, `COUNT(*)`
- ⬜ `TwitchToken` не импортируем

## 5. Игры (по одной; каждый виджет собирается заново в стиле наклеек)

- ⬜ Лотерея: `!ticket`, `!tickets`, `!runlottery`, недельный сброс, анимация, VIP победителям
- ⬜ Рулетка: `!spin`, `!spinstats`, джекпот, лента призов на оверлее
- ⬜ Рыбалка: `!fish`
- ⬜ Pivo: `!pivo`, золотое пиво
- ⬜ Герои и магазин: каталог `heroes.json`, `!buy`, `!use`, `!shop`, Phaser-полоса героев

## 6. Админка

- ⬜ Вход через Twitch (один разрешённый пользователь)
- ⬜ Просмотр зрителей и балансов, управление

## Остальное

- ⬜ Музыкальный виджет и `POST /api/music/state` (Windows-агент из `tools/music-agent/`)
- ⬜ Деплой: два процесса (Nuxt + бот), `prod.db` на сервере, бэкап файла БД по cron

## Открытые вопросы

- ❓ **Ачивки.** В старой базе таблицы ачивок нет. Нужно решить, нужны ли они вообще; если да — проектировать заново (`Achievement { key, viewerId, unlockedAt }` с каталогом в JSON). Решить до этапа игр.
