# Быстрый старт для своего канала

Отдельный аккаунт для бота **не нужен**: бот пишет от твоего аккаунта. Работает на Windows и Mac, Docker не нужен.

## 1. Установи программы

- [Node.js 22+](https://nodejs.org) (LTS)
- [Git](https://git-scm.com)
- [OBS Studio](https://obsproject.com)
- pnpm: открой терминал и выполни `corepack enable`

## 2. Скачай проект

```bash
git clone https://github.com/LuckyFoxCode/fox-sphere-nuxt.git
cd fox-sphere-nuxt
pnpm install
```

## 3. Создай приложение на Twitch

1. Зайди на https://dev.twitch.tv/console своим аккаунтом, **Applications → Register Your Application**.
2. **Name**: любое. **OAuth Redirect URL**: `http://localhost:3000/auth/twitch/callback`. **Category**: Chat Bot. **Client Type**: Confidential.
3. Нажми **Create**, затем **Manage**. Скопируй **Client ID** и нажми **New Secret**, скопируй **Client Secret** (показывается один раз).

## 4. Заполни настройки

Скопируй шаблон (Windows PowerShell: `Copy-Item .env.example .env.production`):

```bash
cp .env.example .env.production
```

Открой `.env.production` и поменяй только эти строки, остальное оставь:

```
NITRO_PORT=3000
DATABASE_URL=file:./data/prod.db
BOT_ENABLED=true
OVERLAY_URL=http://localhost:3000
COMMAND_PREFIX=!
TWITCH_BOT_REDIRECT_URI=http://localhost:3000/auth/twitch/callback
TWITCH_CHANNEL_NAME=твой_логин_строчными
TWITCH_CLIENT_ID=вставь_Client_ID
TWITCH_CLIENT_SECRET=вставь_Client_Secret
INTERNAL_SECRET=случайная_строка
ADMIN_SESSION_SECRET=другая_случайная_строка
```

`TWITCH_USER_ID` пока оставь пустым, `TWITCH_BOT_ID` оставь пустым совсем: так бот работает от твоего аккаунта.

Случайную строку получишь командой (выполни два раза, для двух значений):

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Если ты не на Windows, добавь строку `MUSIC_ENABLED=false`.

## 5. Создай базу и запусти

```bash
pnpm db:push:prod
pnpm db:seed:prod
pnpm build
pnpm start
```

Окно с `pnpm start` держи открытым: пока оно работает, работает и бот.

## 6. Войди через Twitch (один раз)

1. Открой `http://localhost:3000/auth/twitch/login` и войди своим аккаунтом. Страница покажет `id ...` с числом: это твой Twitch ID.
2. Впиши число в `TWITCH_USER_ID` в `.env.production`.
3. Останови `pnpm start` (Ctrl+C), запусти снова и войди по той же ссылке ещё раз. Второй вход нужен, чтобы токен получил все права.
4. Перезапусти `pnpm start`. Напиши в чате `!coins`: бот должен ответить.

## 7. Добавь оверлей в OBS

Проще всего добавить **одну общую сцену**: в ней уже собраны все виджеты (чат, герои, алерты, шапка стрима, рулетка, профиль, лотерея, магазин, таймер, «сейчас играет»).

В нужной сцене OBS: **+ → Browser**, **Width 1920, Height 1080**, в **URL**:

```
http://localhost:3000/overlay/scene
```

Включи у источника **Control audio via OBS**, чтобы звук алертов шёл в микшер. Больше ничего добавлять не нужно.

Если хочешь двигать виджеты по отдельности (например, чат в одном месте, а герои в другом), вместо общей сцены добавь нужные **отдельные источники**, каждый как отдельный Browser 1920×1080:

| Что | Адрес |
|---|---|
| Чат | `http://localhost:3000/overlay/chat` |
| Алерты (фолловы, рейды) | `http://localhost:3000/overlay/alerts` |
| Герои | `http://localhost:3000/overlay/heroes` |
| Шапка стрима | `http://localhost:3000/overlay/stream` |
| Рулетка | `http://localhost:3000/overlay/roulette` |
| Профиль (`!profile`) | `http://localhost:3000/overlay/profile` |

Остальные отдельные оверлеи (лотерея, магазин, таймер, лидерборд, «сейчас играет») с описанием есть на `http://localhost:3000/`. Общую сцену и отдельные источники одновременно не добавляй: виджеты задвоятся.

## 8. Вход в админку

Открой `http://localhost:3000/admin` и войди тем же аккаунтом. Там зрители, тексты команд (замени ссылки-заглушки на свои), язык бота и настройки.

---

## Если что-то не так

| Симптом | Что делать |
|---|---|
| `redirect_mismatch` на Twitch | Адрес в консоли Twitch и `TWITCH_BOT_REDIRECT_URI` должны совпадать буква в букву |
| «Не тот аккаунт» после входа | Ты вошла в Twitch другим аккаунтом: открой ссылку в окне инкогнито |
| При старте `... не задан` | Не заполнена строка из шага 4 |
| Бот молчит | Проверь `BOT_ENABLED=true`, префикс `!` и что окно `pnpm start` открыто |
| Нет фолловов и наград | `TWITCH_USER_ID` пуст или не было второго входа (шаг 6) |
| В админку не пускает | `ADMIN_SESSION_SECRET` пуст или короче 32 символов |
| «порт занят» | Задай другой `SOCKET_PORT` в `.env.production` |

## Что полезно знать

- Награды за баллы, подписки и Bits Twitch отдаёт только аффилиатам: без этого такие алерты просто не придут.
- Виджет «сейчас играет» работает только на Windows, с любым браузером или плеером.
- Обновить проект: `git pull`, `pnpm install`, `pnpm db:push:prod`, `pnpm build`, перезапуск.
- Хочешь экспериментировать и не трогать боевой чат: сделай ещё `.env.development` (порт 3001, `BOT_ENABLED=false`, префикс `!t`, второй Redirect URL `http://localhost:3001/auth/twitch/callback`) и запускай `pnpm dev`.
- Если позже заведёшь отдельный аккаунт для бота, впиши его id в `TWITCH_BOT_ID`, войди под ним на `/auth/twitch/login` и под собой на `/auth/twitch/broadcaster/login`, и дай боту `/mod`.
