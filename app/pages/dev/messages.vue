<script setup lang="ts">
// Все фразы бота на трёх языках рядом, с примерами значений: для проверки переводов.
import { BOT_LANG, LANGS, MESSAGES, type BotMessages, type Lang } from '#shared/i18n';
import textCommands from '~~/prisma/seed/commands.default.json';

const NAME = 'Fox';
const PREFIX = '!';

type Row = [label: string, render: (t: BotMessages, lang: Lang) => string];

// Простые команды лежат не в словарях, а в базе; здесь показан шаблон, которым её заполняет сид
const textResponse = (name: string, lang: Lang, index: number) =>
  textCommands
    .find((command) => command.name === name && command.lang === lang)
    ?.responses[index]?.replaceAll('{user}', NAME)
    .replaceAll('{prefix}', PREFIX)
    .replaceAll('{version}', '0.1.0') ?? '— нет перевода';

const TEXT_ROWS: Row[] = textCommands
  .filter((command) => command.lang === 'en')
  .flatMap(({ name, responses }) =>
    responses.map((_, index): Row => [
      responses.length > 1 ? `!${name} ${index + 1}` : `!${name}`,
      (_t, lang) => textResponse(name, lang, index),
    ]),
  );

const SECTIONS: { title: string; description: string; rows: Row[] }[] = [
  {
    title: 'Уровни и события',
    description: 'Что бот пишет сам: новые уровни, follow, рейд и награды за баллы канала.',
    rows: [
      ['Новый уровень зрителя', (t) => t.levelUp(NAME, 5)],
      ['Новый уровень стрима', (t) => t.streamLevelUp(11)],
      ['Follow', (t) => t.follow(NAME)],
      ['Рейд', (t) => t.raid(NAME, 42)],
      ['Рейд на 1 зрителя', (t) => t.raid(NAME, 1)],
      ['Награда за баллы', (t) => t.reward(NAME, 'Hydrate')],
    ],
  },
  {
    title: 'Монеты',
    description: 'Баланс зрителя по команде !coins. Карточка !profile показывается на оверлее и в чат не пишет.',
    rows: [
      ['!coins', (t) => t.coins(NAME, 250)],
      ['!coins, 1 монета', (t) => t.coins(NAME, 1)],
      ['!coins, 3 монеты', (t) => t.coins(NAME, 3)],
    ],
  },
  {
    title: 'Рулетка',
    description: 'Игра на монеты: спин командой !spin и статистика зрителя по !spinstats.',
    rows: [
      ['Кулдаун', (t) => t.spin.cooldown(NAME, 12, PREFIX)],
      ['Не хватает монет', (t) => t.spin.notEnough(NAME, 100, 40)],
      ['Приз: монеты', (t) => t.spin.coins(NAME, 250)],
      ['Приз: XP', (t) => t.spin.xp(NAME, 35)],
      ['Джекпот: анонс', (t) => t.spin.jackpotAnnounce(NAME)],
      ['Джекпот: сумма', (t) => t.spin.jackpotResult(NAME, 11540, 1000)],
      ['!spinstats без спинов', (t) => t.spin.statsNone(NAME, PREFIX)],
      ['!spinstats', (t) => t.spin.stats(NAME, 5, 300, 200)],
    ],
  },
  {
    title: 'Рыбалка',
    description: 'Бесплатная игра !fish: заброс удочки и улов с монетами, XP или сундуком в банк.',
    rows: [
      ['Заброс', (t) => t.fish.cast(NAME)],
      ['Уже рыбачит', (t) => t.fish.already(NAME)],
      ['Кулдаун', (t) => t.fish.cooldown(NAME, 42)],
      ['Сорвалась 1', (t) => t.fish.empty[0](NAME)],
      ['Сорвалась 2', (t) => t.fish.empty[1](NAME)],
      ['Сорвалась 3', (t) => t.fish.empty[2](NAME)],
      ['Монеты 1', (t) => t.fish.coins[0](NAME, 25)],
      ['Монеты 2', (t) => t.fish.coins[1](NAME, 70)],
      ['Монеты 3', (t) => t.fish.coins[2](NAME, 100)],
      ['XP', (t) => t.fish.xp(NAME, 40)],
      ['Сундук', (t) => t.fish.bank(NAME, 200)],
    ],
  },
  {
    title: 'Пиво',
    description: 'Команда !pivo: обычная фраза или редкое золотое пиво.',
    rows: [
      ['Обычное 1', (t) => t.pivo.regular[0](NAME)],
      ['Обычное 2', (t) => t.pivo.regular[1](NAME)],
      ['Обычное 3', (t) => t.pivo.regular[2](NAME)],
      ['Обычное 4', (t) => t.pivo.regular[3](NAME)],
      ['Обычное 5', (t) => t.pivo.regular[4](NAME)],
      ['Золотое', (t) => t.pivo.golden(NAME)],
    ],
  },
  {
    title: 'VIP',
    description: 'Выдача и снятие VIP командами !addvip и !removevip. Только стример и модераторы.',
    rows: [
      ['Выдан', (t) => t.vip.added('ModMike', NAME)],
      ['Снят', (t) => t.vip.removed('ModMike', NAME)],
      ['Без ника: !addvip', (t) => t.vip.usage(NAME, PREFIX, 'addvip')],
      ['Без ника: !removevip', (t) => t.vip.usage(NAME, PREFIX, 'removevip')],
      ['Ник не найден', (t) => t.vip.notFound('nobody')],
      ['Нет прав', (t) => t.vip.denied(NAME)],
      ['Twitch не принял', (t) => t.vip.failed(NAME)],
    ],
  },
  {
    title: 'Founder',
    description: 'Статус основателя с бонусом XP: !addfounder и !removefounder. Только стример и модераторы.',
    rows: [
      ['Выдан', (t) => t.founder.added('ModMike', NAME)],
      ['Снят', (t) => t.founder.removed('ModMike', NAME)],
      ['Без ника: !addfounder', (t) => t.founder.usage(NAME, PREFIX, 'addfounder')],
      ['Без ника: !removefounder', (t) => t.founder.usage(NAME, PREFIX, 'removefounder')],
      ['Ник не найден', (t) => t.founder.notFound('nobody')],
      ['Нет прав', (t) => t.founder.denied(NAME)],
      ['Не получилось', (t) => t.founder.failed(NAME)],
    ],
  },
  {
    title: 'Герои',
    description: 'Покупка героя за монеты (!buy hero) и смена активного (!use hero). Витрина !shop открывается на оверлее.',
    rows: [
      ['!buy без имени', (t) => t.hero.buyUsage(NAME, PREFIX)],
      ['!use без имени', (t) => t.hero.useUsage(NAME, PREFIX)],
      ['Нет такого героя', (t) => t.hero.unknown(NAME, 'Assassin, Robber')],
      ['Уже куплен', (t) => t.hero.alreadyOwned(NAME, 'Robber')],
      ['Не хватает монет', (t) => t.hero.notEnough(NAME, 'Robber', 300, 100, 200)],
      ['Куплен', (t) => t.hero.bought(NAME, 'Robber', 300, 450, PREFIX)],
      ['Получен бесплатно', (t) => t.hero.bought(NAME, 'Assassin', 0, 450, PREFIX)],
      ['Ещё не куплен', (t) => t.hero.notOwned(NAME, 'Robber', PREFIX)],
      ['Уже надет', (t) => t.hero.alreadyActive(NAME, 'Robber')],
      ['Надет', (t) => t.hero.equipped(NAME, 'Robber')],
    ],
  },
  {
    title: 'Буст XP',
    description: 'Временное умножение XP за сообщения командой !xpboost. Только стример и модераторы.',
    rows: [
      ['Включён', (t) => t.xpBoost.started(NAME, 30, 2)],
      ['Включён на 1 минуту', (t) => t.xpBoost.started(NAME, 1, 2)],
      ['Неверная длительность', (t) => t.xpBoost.usage(NAME, PREFIX, 5, 60)],
      ['Отменён', (t) => t.xpBoost.cancelled(NAME)],
      ['Нечего отменять', (t) => t.xpBoost.noActive(NAME)],
      ['Нет прав', (t) => t.denied(NAME)],
    ],
  },
  {
    title: 'Таймер',
    description: 'Таймер на оверлее: запуск !timer и остановка !stoptimer. Только стример и модераторы.',
    rows: [
      ['Запущен', (t) => t.timer.started(NAME, 60, 'Скоро вернусь')],
      ['Запущен на 1 минуту', (t) => t.timer.started(NAME, 1, 'BRB')],
      ['Неверное время', (t) => t.timer.usage(NAME, PREFIX)],
      ['Остановлен', (t) => t.timer.stopped(NAME)],
      ['Нет прав', (t) => t.denied(NAME)],
    ],
  },
  {
    title: 'Лотерея VIP',
    description: 'Билеты за недельный XP (!ticket, !tickets) и розыгрыш временного VIP (!runlottery, только стример).',
    rows: [
      ['Билет получен', (t) => t.lottery.ticketEarned(NAME)],
      ['!ticket: прогресс', (t) => t.lottery.ticketProgress(NAME, 37, 100)],
      ['!ticket: билет уже есть', (t) => t.lottery.ticketHave(NAME)],
      ['!tickets: билетов нет', (t) => t.lottery.noTicketsYet],
      ['!tickets: от 10 билетов', (t) => t.lottery.totalTickets(42)],
      ['!tickets: список до 10', (t) => t.lottery.ticketList('🔹 1. @Fox, 🔹 2. @Lynx', 2, 100)],
      ['Розыгрыш уже идёт', (t) => t.lottery.alreadyRunning(NAME)],
      ['Старт розыгрыша (анонс)', (t) => t.lottery.start],
      ['Twitch не выдал VIP', (t) => t.lottery.vipFailed(NAME)],
      ['Финал (анонс)', (t) => t.lottery.final],
      ['Нет билетов: розыгрыш отложен', (t) => t.lottery.postponed],
      ['Нет прав', (t) => t.denied(NAME)],
    ],
  },
  {
    title: 'Лотерея на оверлее',
    description: 'Надписи сцены розыгрыша и алерта билета, в чат не идут.',
    rows: [
      ['Подпись и заголовок', (t) => `${t.lotteryScene.label} / ${t.lotteryScene.title}`],
      ['Фазы', (t) => `${t.lotteryScene.intro} → ${t.lotteryScene.drawing} → ${t.lotteryScene.finale}`],
      ['Участники, чипы, финал', (t) => `${t.lotteryScene.entries} · ${t.lotteryScene.newVip} · ${t.lotteryScene.extended} · ${t.lotteryScene.until}`],
      ['Список билетов', (t) => `${t.lotteryScene.listLabel} · ${t.lotteryScene.listTitle(42)} · ${t.lotteryScene.more(180)}`],
      ['Алерт билета', (t) => `${t.lotteryScene.ticketLabel} · ${t.lotteryScene.ticketDetail}`],
    ],
  },
  {
    title: 'Алерт сундука на оверлее',
    description: 'Надписи алерта, когда на рыбалке пойман сундук, в чат не идут.',
    rows: [
      ['Лента', (t) => t.chestAlert.label],
      ['Сумма в банк', (t) => t.chestAlert.toBank(200)],
    ],
  },
  {
    title: 'Текстовые команды',
    description: 'Из шаблона prisma/seed/commands.default.json. В базе тексты могут отличаться: сид не трогает записи, которые там уже есть.',
    rows: TEXT_ROWS,
  },
];
</script>

<template>
  <main class="min-h-screen bg-sticker-well p-6 font-quicksand text-sticker-ink">
    <h1 class="text-2xl font-bold">Фразы бота</h1>
    <p class="mt-1 text-sm text-sticker-muted">
      Сейчас бот отвечает на <code>{{ BOT_LANG }}</code> (<code>BOT_LANG</code> в <code>shared/i18n/index.ts</code>).
      Тексты — в файлах <code>shared/i18n/</code>, текстовые команды — в базе (внизу страницы).
      <NuxtLink class="underline" to="/dev/events">Эмулятор событий</NuxtLink>
    </p>

    <section v-for="section in SECTIONS" :key="section.title" class="mt-10">
      <h2 class="text-xl font-bold">{{ section.title }}</h2>
      <p class="mt-1 text-sm text-sticker-muted">{{ section.description }}</p>
      <div class="mt-3 flex flex-col gap-y-2">
        <article v-for="[label, render] in section.rows" :key="label" class="rounded-lg bg-sticker-track p-3">
          <h3 class="text-sm leading-6 font-bold"><CommandLabel :text="label" /></h3>
          <div class="mt-2 grid gap-x-4 gap-y-1 lg:grid-cols-3">
            <p v-for="lang in LANGS" :key="lang" :lang="lang" class="text-sm">
              <span class="mr-2 text-sticker-muted">{{ lang }}</span>{{ render(MESSAGES[lang], lang) }}
            </p>
          </div>
        </article>
      </div>
    </section>
  </main>
</template>
