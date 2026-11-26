# DESIGN.md — визуальный стиль оверлея fox-sphere (для переноса в Nuxt 4 + Tailwind 4)

Пути ниже — от корня старого репозитория `LuckyFoxCode/fox-sphere` (только как справка, где лежал исходник).

## 0. Откуда этот гайд и что в нём главное

Источник: `apps/overlay/DESIGN.md` старого репозитория `LuckyFoxCode/fox-sphere`. Значения токенов совпадают с `apps/overlay/src/assets/styles/main.css` старого репо (источник истины по значениям).

**Решение владельца: в новом проекте единственный стиль — «графитовые наклейки» (sticker HUD) и «бумага».** Старый неоновый стиль (`WidgetFrame`, неоновые рамки, свечение, «болты» и «колпачки») — устаревший UI, который в старом репо так и не удалили; он **не переносится вообще**: ни компоненты, ни токены, ни анимации. Всё, что в старом проекте было на неоне, собирается заново в стиле наклеек (см. 4.8).

---


## 1. Концепция

Прозрачный холст OBS-браузерсорса (fixed 16:9, без адаптива, без интерактива: зрители действуют в чате, оверлей только реагирует).

Три материала, и виджет выбирает один по роли, а не по названию:

| Материал | Кто | Почему |
|---|---|---|
| **графит** (graphite) | всегда видимое, показывает число: банк, XP, уровень, музыка, тело событий | не должно спорить с игрой |
| **бумага** (paper) | сам контент: сообщение чата, карточка профиля | это то, ради чего смотрят |
| **цветная бумага** | событие или виджет, цвет которого выбрал стример: таймер, follow, raid, reward… | это новость, цвет — часть новости |

Общий язык материалов: тёплый овсяный контур 2px, бумажное зерно, шрифт Quicksand, одна мягкая смещённая тень.

Правила (из гайда, дословный смысл):
- **Matte**: никакого свечения, ореола, пульса.
- **One-Hairline**: контур 2px овсяный (`#dccbb2`), не тоньше. Тень обязательна вместе с ним (на ярком геймплее овсяная линия сама теряется).
- **Flat-Cell**: прогресс = плоские ячейки, не градиентная пилюля. Последняя заполненная — мятная, остальные розовые, пустые — «дорожка».
- **Square**: наклейки не вращать. Рукодельность даёт зерно и контур.
- **Event-Paper**: цвет события = бумага плиток/пластины, а не тело виджета. Один цвет на виджет.
- **Ink**: на бумаге числа графитовые. Цвет разрешён только имени зрителя (его цвет Twitch) и четырём знакам статов героя.
- **Flip** — единственное «моторное» движение в HUD, 260 мс.
- Не использовать чистый `#000` и `#fff` как поверхности.

---

## 2. Токены

### 2.1 Цвета (копировать как есть, `main.css`)

```css
:root {
  /* нейтрали */
  --bg: #09090b;  --card: #18181b;  --popover: #202024;  --line: #27272a;
  --text-main: #fafafa;  --text-second: #a1a1aa;  --text-inverse: #09090b;
  --lime: #a3e635;          /* единственный бренд-акцент: прогресс, выделение, фокус */
  --success: #22c55e; --error: #ef4444; --warning: #f97316; --info: #3b82f6;
  --link: #3b82f6;

  /* цвета событий: из них сделана «бумага»; сами по себе как поверхность не используются */
  --twitch-cyan: #00ffcc;  --twitch-purple: #bf55ec;  --twitch-red: #ff4757;
  --twitch-amber: #ffa502; --twitch-blue: #3b82f6;    --twitch-rose: #f6339a;

  /* графитовая наклейка */
  --sticker-body: #2b2630;   /* тело */
  --sticker-edge: #dccbb2;   /* овсяный контур, лицо чипа !spin, зерно */
  --sticker-ink: #f2ecf6;    /* числа */
  --sticker-muted: #a49ab0;  /* подписи */
  --sticker-track: #423b4c;  /* пустые ячейки, фон чипов */
  --sticker-well: #201c25;   /* углубление под контент */
  --sticker-rose: #e08aa4;   /* заполненные ячейки, колесо рулетки */
  --sticker-mint: #8fc9b8;   /* ведущая ячейка и процент: единственный «live» сигнал */

  /* бумага события (6 цветов, обесцвечены и осветлены) */
  --paper-amber: #f2dfba;  --paper-blue: #d8e3f7;  --paper-cyan: #cfe9e1;
  --paper-purple: #e8d9f2; --paper-red: #f7dcd7;   --paper-rose: #f8dbe8;
}
```

Привязка к Tailwind 4 уже сделана через `@theme { --color-sticker-body: var(--sticker-body); … }` — **просто перенести блок `@theme` из `main.css` в `app/assets/css/main.css` нового проекта.** Классы вроде `bg-sticker-body`, `text-sticker-ink`, `border-sticker-edge`, `bg-paper-amber`, `text-event-rose` заработают без правок разметки.

Присвоение бумаги событию (по смыслу, без дублей): follow=red, raid=cyan, reward=purple, add-vip=rose, watch-streak=blue, golden-beer=amber. Таймер: любой из шести (`!timer 5 red BRB`), по умолчанию blue. Карта лежит в `apps/overlay/src/constants/paperSurfaces.ts`. Классы **писать строкой целиком** (`'bg-paper-amber'`), а не `bg-paper-${v}` — Tailwind не увидит.

### 2.2 Шрифты

- **Rubik** (300–900) — тело, заголовки старого мира, имена в чате ранга.
- **Quicksand** (300–700) — всё наклеечное: числа HUD, подписи, тело чат-сообщения.

Сейчас подключены через Google Fonts `@import`. В Nuxt лучше `@nuxt/fonts` или локально (OBS без интернета не получит шрифт).

```css
@theme { --font-rubik: 'Rubik', sans-serif; --font-quicksand: 'Quicksand', sans-serif; }
body { @apply font-rubik bg-bg text-text-main; -webkit-font-smoothing: antialiased; }
```

Типографика наклейки:
- **Микро-лейбл**: Quicksand 10px, bold, `tracking-[0.17em]`, uppercase, цвет `sticker-muted`. Это повторяется почти везде.
- **Числа**: bold, обязательно `tabular-nums` (иначе банк «дрожит»).
- Заголовок события: 20px bold (`text-xl`), с фигурой — 18px semibold; детали 14px medium muted.
- Крупная фигура (`x12`): 36px (`text-4xl`) bold.
- Цифры таймера: 48px (`text-5xl`) bold, графит на бумаге.
- Заголовок таймера: 16px bold, truncate, **не капитализировать** (печатается как набрал стример).

### 2.3 Формы, отступы, тени

- Радиус карточек: `rounded-2xl` (16px). Внутренние плитки `rounded-xl` (12px), чипы `rounded-md`/`rounded-lg`, прогресс `rounded-full`.
- Контур: `border-2 border-sticker-edge`.
- Тень наклейки: `shadow-[0_10px_24px_rgba(0,0,0,0.45)]` (одна, смещённая вниз, без цвета).
- База отступов 4px. Типичные паддинги наклейки: `py-1 pr-2 pl-2.5` (узкий HUD), `px-3.5 pt-3 pb-4` (музыка), `py-2.5 pr-3 pl-2.5` (событие).
- Бумажное зерно: `radial-gradient(<цвет> 0.6px, transparent 0.6px)`, `background-size: 3px 3px`, opacity 0.45–0.5, радиус зерна = 14px (16 минус 2px бордера).

### 2.4 Анимации (все в `@layer base` внутри `main.css`)

| Имя | Параметры | Где |
|---|---|---|
| `sticker-slap` | вход 180 мс, выход 140 мс, кривая `cubic-bezier(0.16,1,0.3,1)` / выход `(0.4,0,1,1)`; вход: `opacity 0, scale 1.06, translateY(-2px)`; выход: `opacity 0, scale 0.985` | все event-стикеры |
| `bubble-fade` | вход 0.2s `cubic-bezier(0.34,1.56,0.64,1)` из `translateY(4px) scale(.9)`; выход 0.4s | пузырь сообщения героя |
| `chat-list` | 0.5s `cubic-bezier(0.16,1,0.3,1)`, вход `translateY(100%) scale(.9)` | лента чата |
| `hero-fade` | только opacity 0.4s | спрайт героя (трансформ пишет Phaser) |
| `profile-slide` | 0.4s, `translateX(120%)` | карточка профиля |
| `reel` | 140 мс, `translateY(±0.45em)` + `blur(2px)` | смена числа банка |
| `boost-fade` / `music-fade` | opacity 200 мс / 400 мс | плашка буста / музыка |
| `flip` | 260 мс `ease-in-out`, `rotateX 0 → -90 → 0`, цифра подменяется на середине | цифры таймера |
| `animate-spin-slow` | 4s linear infinite | колесо в тикере |

Анимацию `zoom-in` и пульс `drop-shadow` старого неонового мира **не переносить**: у наклеек вход/выход — `sticker-slap`.

Везде уважается `prefers-reduced-motion`.

---

## 3. Раскладка сцены

Источник: `apps/overlay/src/components/TheOverlay.vue`. Слои (z): Phaser-холст (прозрачный) → `HeroLane` (z-10) → `TheHeader`, `MusicWidget`, `StreamXpBoost`, `main` (z-10).

```
┌─────────────────────────────────────────────────────────────┐
│                          [!spin банк][XP+уровень, w-100]    │ header: flex justify-end, pt-2 pr-3, gap-x-2
│                    [×2 буст]  [Play now, w-80, top 74px]    │ top-18.5; буст right-[21.5rem]
│                                                             │
│                    (по центру: лотерея, рулетка,            │ fixed top-1/2 left-1/2
│                     профиль/магазин/уровень героя)          │
│                                                             │
│  ┌ sidebar w-100 ┐                                          │ aside h-[85%], слева
│  │ таймер        │          [event-стикер w-105]            │ fixed bottom-48, по центру
│  │ чат           │          герои бегают по нижней линии   │
│  └───────────────┘                                          │
└─────────────────────────────────────────────────────────────┘
```

Плавающие позиции:
- События Twitch: `fixed bottom-48 left-1/2 -translate-x-1/2` (только X: чтобы док двигался вверх, а не дрейфовал от высоты).
- Герои-карточки: `fixed bottom-[15%] left-1/2 -translate-1/2`. Лотерея и рулетка: `fixed top-1/2 left-1/2 -translate-1/2`.
- Музыка: `absolute top-18.5 right-3 z-10 w-80` (под XP-стикером).
- Буст XP: `absolute top-18.5 right-[21.5rem]` — **сам absolute** (иначе сдвигает чат). 21.5rem = 320px карточка музыки + 12px зазор: менять синхронно.

---

## 4. Виджеты

### 4.1 Общие оболочки (**копировать почти как есть**, это маленькие SFC)

| Оболочка | Файл | Суть |
|---|---|---|
| `StickerFrame` | `apps/overlay/src/components/ui/sticker-frame/StickerFrame.vue` | `rounded-2xl border-2 border-sticker-edge bg-sticker-body font-quicksand shadow-[0_10px_24px_rgba(0,0,0,.45)]` + зерно (scoped CSS). Основа всех HUD и событий |
| `PaperFrame` | `…/ui/paper-frame/PaperFrame.vue` | то же, но без фона, зерно из чернил `rgba(43,38,48,.14)`; бумагу подаёт вызывающий |
| `EventSticker` | `…/ui/event-sticker/EventSticker.vue` | анатомия события: бумажная пластина слева + графитовая колонка |
| `FlipDigit` | `…/ui/FlipDegit.vue` (опечатка в имени файла) | цифра таймера, 44×75px (`w-11 h-18.75`), две половины с бумагой |
| `MarqueeText` | `…/music/MarqueeText.vue` | бегущая строка, только если `scrollWidth` > ширины бокса |

### 4.2 Шапка (график)

**Тикер рулетки** (`roulette/RouletteTicker.vue`): StickerFrame `gap-x-2.5 py-1 pr-2 pl-2.5`. Слева колесо `IconLotteryWheel` 28px (`sticker-rose`, вращается 4с), лейбл `take bank` (10px muted), число банка (`text-lg bold tabular-nums`, с `reel`-переходом), справа овсяный чип `!spin` (`bg-sticker-edge text-sticker-body rounded-lg px-2 py-0.5 text-sm`). Состояние загрузки: серый скелетон `bg-sticker-track h-4 w-14 animate-pulse`.

**XP-виджет** (`stream/XpWidget.vue`, `XpProgressBar.vue`, `LevelBadge.vue`): StickerFrame `w-100 gap-x-2.5 py-1 pr-3 pl-2.5`. Слева кольцо ранга 46px голое (без рамки: кольцо само = ранг, название ранга рядом не печатается). Справа: строка «`new / max XP`» (muted) и `NN%` (mint), под ней **40 плоских ячеек** `h-2.5 gap-0.5 rounded-xs`: пустые `sticker-track`, заполненные `sticker-rose`, ведущая `sticker-mint`, переход цвета 700 мс.

**Музыка** (`music/MusicWidget.vue`): StickerFrame `w-80 px-3.5 pt-3 pb-4`, при паузе `opacity-70`. Строка 1: круглая овсяная иконка ноты (20px) + «Play now» (15px bold) и справа овсяный чип с часами. Строка 2: «углубление» `bg-sticker-well border border-sticker-edge/25 rounded-xl`: обложка 72px (`size-18`) слева, исполнитель (14px semibold muted), название (18px bold, MarqueeText). Строка 3 (только если есть длительность): время слева/справа 12px muted, бар `h-2.5 rounded-full` дорожка → розовая заливка → мятная правая кромка 8px, поверх **сетка 40 делений** (`border-r-2 border-sticker-body`) для вида ячеек. Заливка едет непрерывно (иначе дёргается). Если `durationMs = 0` (радио) — бар не рисуется. Виджет прячется через 45 с без пакета.

**Буст XP** (`stream/widgets/StreamXpBoost.vue`): маленький StickerFrame `gap-x-2 py-1.5 pr-3 pl-1.5`; пластина `bg-paper-purple size-7 rounded-lg` с молнией, `×2` (14px bold), остаток времени (12px muted). Только `opacity` 200 мс.

### 4.3 Чат (бумага, левая колонка)

Файлы: `twitch/widgets/chat/ChatWidget.vue`, `components/ChatMessageList.vue`, `components/ChatMessageItem.vue`, роли — `constants/chatRoles.ts`.

- Контейнер: `h-181.25 rounded-2xl border-2 border-slate-600 bg-slate-700/30 pt-3`; заголовок «Live chat» (`font-quicksand text-xl`) с красной пульсирующей точкой (`bg-rose-500`, glow `0 0 8px 2px #f43f5e`).
- Список: `flex-col justify-end gap-y-5`, `rounded-lg border-t-2 border-slate-700 bg-slate-800/50 px-2 py-3`, `box-shadow: 0 4px 10px #314158`.
- **Сообщение** (карточка): рамка `border-2 rounded-xl` цвета роли; верхняя тёмная полоса с градиентом роли (`bg-linear-to-r from-<роль>-400 to-<роль>-900`, `border-slate-800`, `pt-10`) с медалью ранга (40px), названием ранга и чипом роли; светлое тело (`bg-linear-to-r from-<роль>-50 to-<роль>-200`, Quicksand, `px-3 py-2`, тёмный текст `text-bg`), имя зрителя 15px semibold своим цветом Twitch, значки 20px, эмоуты 36px.
- Роли (порядок = приоритет): broadcaster=sky, bot=cyan, mod=green, vip=pink, sub=purple, follower=emerald, viewer=blue. Чип: `border-500 bg-950 text-300`.
- Специальные плашки: Announcement, Highlight (rose), Watch Streak (цвет сообщения).

### 4.4 Таймер (над чатом)

`twitch/widgets/TwitchTimer.vue`: StickerFrame `w-full flex-col gap-y-2.5 px-3.5 pt-2.5 pb-3`. Заголовок по центру. Ряд `FlipDigit` `gap-x-2`, разделитель `:` 34px `text-sticker-ink/55`. Цифры графит на бумаге цвета стримера.

### 4.5 События Twitch (`EventSticker`, одна анатомия, шесть виджетов)

Ширина 420px (`w-105`), `gap-x-3 py-2.5 pr-3 pl-2.5`.
- **Пластина** слева: `size-12 rounded-xl` бумага события, внутри иконка 32px графитовая; если есть арт достижения — пластина `size-32` с картинкой 200px `object-contain`.
- **Колонка**: лейбл (10px, 0.17em, muted, uppercase) + опциональный **овсяный тег** (`NEW`, `NEW TIER`) справа; крупная фигура `x12`; заголовок (имя); деталь; чипы `bg-sticker-track text-sticker-ink rounded-md px-1.5 py-1 text-xs bold`.
- Тег-чип овсяный — только для флагов, не для фактов. Чипы фактов графитовые.
- В новом проекте у алертов подписки крупное число (месяцы, подарки) стоит не в колонке, а в графитовой плитке справа (`bg-sticker-track rounded-xl`, 30px и подпись 10px), уровень подписки — в лейбле: стикер не растёт в высоту.

| Событие | Файл | Бумага | Иконка | Текст/фигура |
|---|---|---|---|---|
| follow | `TwitchFollow.vue` | red | `IconPaw` | «new follower», «welcome to the sphere» |
| raid | `TwitchRaid.vue` | cyan | `IconLightning` | «raid incoming», чипы (зрители) |
| reward | `TwitchRewardRedeem.vue` | purple | `IconGift` | название награды чипом |
| VIP | `TwitchAddVip.vue` | rose | `IconCrown` | статус |
| streak | `TwitchWatchStreak.vue` | blue | `IconFlame` / арт `streak-N.webp` | `x{N}`, тег `new` |
| golden beer | `TwitchGoldenBeer.vue` | amber | арт `pivo/tier-N.webp` | `x{N}`, «{tier} brew» |

Иконки **нарисованы** (stroke-width 1.5), эмодзи в наклейках не использовать (на разных машинах разные).

### 4.6 Карточка профиля (бумага)

`profile/widgets/ProfileCard.vue` (385 строк, самая сложная): PaperFrame `w-96`, фон — градиент `body` роли из чата. Шапка (`role.header`, `border-b-2 border-slate-800`): медаль ранга 48px, название ранга с градиентным текстом (`bg-clip-text`), кольцо уровня 48px. Тело: круглый портрет героя `size-40 rounded-full border-2 bg-white/55`, имя своим цветом, строка героя, чипы ролей. Ниже XP и четыре стата (heart=rose, sword=orange, shield=sky, boot=emerald, шейд 700, без прозрачности). Чернила `text-text-inverse`, значения 100%, подписи 50–65%. Появляется `profile-slide` справа. Правило «Borrowed-Strip»: цвет карточки = цвет роли из чата, своей палитры у неё нет.

### 4.7 Герои-ходоки (Phaser + Vue-метка)

- Фон: Phaser с прозрачным холстом (`transparent: true`, `Scale.RESIZE`), код в `apps/overlay/src/phaser/` (`hero-lane.ts`, `scenes/`).
- Метка над спрайтом (`hero/components/ActiveHero.vue`): `bg-line/15 rounded-md border-r-2 px-2`, граница цвета роли (стример amber, sub/founder error, vip rose, mod success, follower purple, по умолчанию blue); имя 16px semibold цветом Twitch; ранг 14px medium uppercase градиентным текстом. Пузырь сообщения: `bg-text-main/80 text-bg rounded-xl px-1.5 py-1 text-sm max-w-57.5`, хвостик-треугольник CSS-бордерами, до 48 символов, эмоуты 36px.
- Спрайты: `public/assets/heroes/<id>/{idle,walking,front}.webp`, сетка кадров из `packages/types/src/hero/heroes.json` (`frameWidth/Height = 480`, `scale 0.25`; idle 4×4=16 кадров @12fps, walk 4×5=20 @16fps, portrait 4×4). Герои: assassin (бесплатный), robber (300), thug (800). **Копировать как есть.**

### 4.8 Виджеты старого неонового мира: собрать заново в стиле наклеек

Лотерея, магазин, карточки героя (`HeroAssigned`, `UserLevelUp`), `StreamLevelUp`, тело рулетки (`RouletteSpin`: лента призов, окно джекпота) в старом проекте стояли на неоне (`WidgetFrame`). **Их внешний вид, рамка и анимации не переносятся.** Каждый такой виджет собирается заново на `StickerFrame` / `EventSticker` по правилам раздела 1 (матовость, овсяный контур, одна тень, ячейки, один цвет бумаги, вход `sticker-slap`). Из старого мира берём только **содержимое и логику**:

- **Лотерея:** заставка «Weekly Lottery Started», список участников, победитель («Place #N»), тикет «earned a Lottery Ticket», финальная сводка.
- **Рулетка:** лента 10 сегментов, редкость призов (common → mythic), иконки и суммы. Каталог сегментов — `constants/rouletteSegments.ts`, редкости — `constants/rarityTiers.ts` (цвета редкостей пересобрать на токенах наклейки/бумаги).
- **Магазин:** три карточки героев (портрет, цена, 4 стата).
- **Левел-ап стрима и героя:** короткая наклейка-событие на `EventSticker`.

Эмодзи в наклейках не используем: иконки рисованные (см. 4.5), поэтому 🪙 ⚡ 👑 🎲 из старой рулетки заменяются на `IconXxx`.

### 4.9 Рулетка: карточки редкостей (новое, по просьбе владельца)

**Лотерея VIP** (`lottery/`): панель `StickerFrame` w-165 по центру, голубая плашка с билетом, пять барабанов по цветам редкостей рулетки (без неона и джекпот-эффектов), бегущая строка имён, в финале бумажные билеты-конфетти и чипы «NEW VIP / EXTENDED». Длина сцены фиксирована (`shared/lottery.ts`: 2.6 + 7 + 5.4 с), число участников меняет только плотность ленты.

Лента и карточки собраны заново: `app/components/roulette/`, превью — `/dev/roulette`. Основа та же графитовая наклейка (овсяные кант и вырубка вокруг картинок, зерно, Quicksand, рисованные знаки без эмодзи), но **у рулетки есть исключение из правила Matte**: свечение, переливы и частицы разрешены, потому что ими читается редкость. В другие виджеты это не переносить.

| Редкость | Призы | Цвет | Кант и фактура | Выигрыш |
|---|---|---|---|---|
| empty | пусто | серый | пунктир, штриховка | вздрагивает, пыль |
| common | 60, 75, +35 XP | мятный | овсяный, горошек | кольцо, искры |
| rare | 100, +100 XP | синий | цветной, полосы, свечение | два кольца, искры |
| epic | 250 | фиолетовый | переливающийся, ромбы, блик | больше искр |
| legendary | 500, 1000 | золотой | золотой, вращающиеся лучи | вспышка, искры |
| jackpot | банк | розовый + радуга | голография, лучи | экран джекпота, конфетти, звук |

Редкость показывает ценность приза, а не шанс (как в старой рулетке). Картинки призов — `app/utils/roulette/art.ts`.

### 4.10 Сундук из рыбалки и пополнение банка (новое, по просьбе владельца)

Второе и последнее исключение из правила Matte, с золотом из легендарной карточки рулетки. Джекпот должен оставаться главным событием, поэтому сундук **не берёт его приёмы**: нет затемнения и вспышки на весь кадр, лучей по кругу, конфетти и радуги.

- **Алерт** (`alerts/ChestAlert.vue`, `ChestArt.vue`, картинка по слоям — `utils/chestArt.ts`): ширина 420px, там же, где остальные события. Сундук-вырубка дрожит, на 0,9 с откидывает крышку; местная вспышка, столб света, искры и монеты дугой. Под сундуком графитовая наклейка с переливающимся золотым кантом: ник, крупная золотая сумма «в банк», снизу золотая лента с названием и ромбиками. Длительность 5,5 с, вход и выход — `sticker-slap`.
- **Банк в шапке** (`RouletteTicker.vue`): при росте суммы число один раз подпрыгивает и золотеет, вокруг тикера на секунду золотая подсветка. При падении (после джекпота) только обычная смена числа.
- В Quicksand нет кириллицы: у алерта сундука запасной шрифт — Rubik.

---

## 5. Ранги и значки

- 10 тиров названий (NEWBIE → OVERLORD) в `apps/overlay/src/constants/ranks.ts`, у каждого градиент для текста; иконок **девять** (`IconRank01..09` медаль + `IconRing01..09` кольцо), десятый тир показывает девятую иконку.
- Градиенты (для `bg-clip-text`): тир1 `#4B5563→#FEF08A→#4B5563`, тир2 `#FCD34D→#B45309→#FCD34D`, тир3 `#475569→#D1D5DB→#E2E8F0`, тир4 `#FCD34D→#FEF08A`, тир5 `#38BDF8→#10B981→#38BDF8`, тир6 `#C084FC→#9333EA→#C084FC`, тир7 `#E11D48→#F472B6→#E11D48`, тир8 `#059669→#34D399→#059669`, тир9 `#0284C7→#38BDF8→#0284C7`, тир10 `#E11D48→#38BDF8→#DC2626`.
- SVG-иконки — Vue-компоненты в `apps/overlay/src/assets/icons/ranks/` и `assets/icons/`. **Копировать как есть** (в Nuxt — как компоненты или через `nuxt-svgo`, градиенты в SVG используют `id`, при инлайне осторожно с коллизиями).

---

## 6. Что копировать как есть, что адаптировать

### Копировать без изменений
- `apps/overlay/public/assets/` целиком: `heroes/*` (спрайт-листы), `achievements/pivo/*`, `achievements/watch-streak/*`, `sound/*` (add-vip, follow, jackpot, knock, level-up, raid, streak, ticket, timer-off).
- `apps/overlay/src/assets/icons/**` (нарисованные иконки: IconPaw, IconGift, IconCrown, IconFlame, IconPint, IconLightning, IconLotteryWheel, IconUser, IconStar, IconSword, IconShield, IconBoot, IconHeartPlus, IconRank, IconDna, IconBot и `ranks/`).
- `packages/types/src/hero/heroes.json` (каталог героев, статы, спрайт-сетки).
- Блок токенов и `@theme` из `apps/overlay/src/assets/styles/main.css` (без неоновых утилит и `zoom-in`/`pulseGlow`), плюс блок `@layer base` с переходами наклеек.
- `constants/`: `chatRoles.ts`, `ranks.ts`, `paperSurfaces.ts`, `rouletteSegments.ts`, `sound.ts` (`rarityTiers.ts` — только данные о редкостях, цвета пересобрать под наклейки).
- SFC-оболочки `StickerFrame`, `PaperFrame`, `EventSticker`, `FlipDigit`, `MarqueeText` — это уже Vue 3 `<script setup>` + Tailwind 4, в Nuxt 4 работают без правок (только пути импортов `@/` → `~/`).
- Утилиты в `apps/overlay/src/utils/music/` (расчёт позиции, формат времени, решение о бегущей строке) — чистые функции.

### Адаптировать под Nuxt 4 + Tailwind 4
- **Шрифты**: заменить Google `@import` на `@nuxt/fonts` (Rubik, Quicksand), чтобы OBS не зависел от сети.
- **Tailwind 4**: уже CSS-first (`@import 'tailwindcss'` + `@theme`), в Nuxt подключать через `@tailwindcss/vite` в `nuxt.config.ts` (`vite.plugins`) и `css: ['~/assets/css/main.css']`. `tailwind.config.js` не нужен.
- **Иконки/SVG**: либо оставить `.vue`-компонентами в `app/components/icons/`, либо в `nuxt-svgo`.
- **Phaser**: `phaser` трогает `window`, в Nuxt грузить только на клиенте (`<ClientOnly>` или `import()` внутри `onMounted`). Страница оверлея — отдельная, `ssr: false` на маршруте `/overlay`, фон `html, body { background: transparent }` обязателен.
- **Socket.io**: в старом проекте — `socket.io-client` к `:3000`; в новом проекте решается отдельно (см. `spec.md`).
- **Алиасы**: `@/` → `~/` (в Nuxt 4 `~` = `app/`).
- **Шапка/сцена**: `TheOverlay.vue` перенести как страницу `app/pages/overlay/index.vue` (в скелете уже есть).
- **Лотерея, магазин, левел-ап, HeroCard**: пересобрать на `StickerFrame` (см. 4.8). Неоновый мир не воскрешать.
- **Чат**: оставить как есть (бумага); его внешний контейнер на `slate-*` в гайде не описан, при желании можно привести к графиту (`sticker-body`) — но это уже решение по дизайну, а не копия.

### Не переносить
- **Весь неоновый стиль:** `WidgetFrame.vue`, `DecorativeCap.vue`, «болты», неоновые рамки и свечение (`text-lime` с glow), `pulseGlow`, `zoom-in` в событиях.
- `apps/overlay/PRODUCT.md` (устарел), `tools/music-agent/` (Windows-агент, отдельная история).

---

## 7. Чек-лист «выглядит так же»

1. Фон страницы прозрачный; единственный непрозрачный фон — графитовые наклейки.
2. У каждой наклейки: овсяный контур 2px + одна тень `0 10px 24px rgba(0,0,0,.45)` + зерно.
3. Шрифт наклеек Quicksand, числа `tabular-nums`, лейблы 10px uppercase `0.17em`.
4. Прогресс — 40 плоских ячеек, ведущая мятная.
5. На событии ровно один цвет — бумага пластины; чипы графитовые.
6. Вход событий 180 мс, выход 140 мс; никаких пульсов и свечения.
7. Ширины: XP 400px, событие 420px, музыка 320px, чат/таймер 400px, профиль 384px.

## 8. Главные исходные файлы

| Что | Где |
|---|---|
| Гайд | `apps/overlay/DESIGN.md` |
| Токены, переходы | `apps/overlay/src/assets/styles/main.css` |
| Сцена | `apps/overlay/src/components/TheOverlay.vue`, `TheHeader.vue`, `TheSidebar.vue` |
| Наклейки | `apps/overlay/src/components/ui/{sticker-frame,paper-frame,event-sticker}/`, `FlipDegit.vue` |
| Виджеты | `components/{roulette,stream,music,twitch,profile,hero,lottery,shop,user}/` |
| Константы | `apps/overlay/src/constants/` |
| Phaser | `apps/overlay/src/phaser/` |
| Спрайты, звуки, арт | `apps/overlay/public/assets/` |
| Каталог героев | `packages/types/src/hero/heroes.json` |
