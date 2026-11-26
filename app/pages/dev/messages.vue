<script setup lang="ts">
// Все фразы бота на трёх языках рядом, с примерами значений: для проверки переводов.
import { BOT_LANG, LANGS, MESSAGES, type BotMessages } from '#shared/i18n';

const NAME = 'Fox';
const PREFIX = '!';

type Row = [label: string, render: (t: BotMessages) => string];

const SECTIONS: { title: string; rows: Row[] }[] = [
  {
    title: 'Уровни и события',
    rows: [
      ['Новый уровень зрителя', (t) => t.levelUp(NAME, 5)],
      ['Новый уровень стрима', (t) => t.streamLevelUp(11)],
      ['Follow', (t) => t.follow(NAME)],
      ['Рейд', (t) => t.raid(NAME, 42)],
      ['Рейд на 1 зрителя', (t) => t.raid(NAME, 1)],
    ],
  },
  {
    title: 'Монеты и профиль',
    rows: [
      ['!coins', (t) => t.coins(NAME, 250)],
      ['!coins, 1 монета', (t) => t.coins(NAME, 1)],
      ['!coins, 3 монеты', (t) => t.coins(NAME, 3)],
      ['!profile', (t) => t.profile(NAME, { lvl: 5, xp: 120, xpToNext: 500, coins: 250, rank: 3 })],
    ],
  },
  {
    title: 'Рулетка',
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
    title: 'Алерт сундука на оверлее',
    rows: [
      ['Лента', (t) => t.chestAlert.label],
      ['Сумма в банк', (t) => t.chestAlert.toBank(200)],
    ],
  },
];
</script>

<template>
  <main class="min-h-screen bg-sticker-well p-6 font-quicksand text-sticker-ink">
    <h1 class="text-2xl font-bold">Фразы бота</h1>
    <p class="mt-1 text-sm text-sticker-muted">
      Сейчас бот отвечает на <code>{{ BOT_LANG }}</code> (<code>BOT_LANG</code> в <code>shared/i18n/index.ts</code>).
      Тексты — в файлах <code>shared/i18n/</code>.
      <NuxtLink class="underline" to="/dev/events">Эмулятор событий</NuxtLink>
    </p>

    <section v-for="section in SECTIONS" :key="section.title" class="mt-6">
      <h2 class="text-lg font-bold">{{ section.title }}</h2>
      <div class="mt-2 flex flex-col gap-y-2">
        <article v-for="[label, render] in section.rows" :key="label" class="rounded-lg bg-sticker-track p-3">
          <h3 class="text-xs font-bold tracking-widest text-sticker-muted uppercase">{{ label }}</h3>
          <div class="mt-1 grid gap-x-4 gap-y-1 lg:grid-cols-3">
            <p v-for="lang in LANGS" :key="lang" :lang="lang" class="text-sm">
              <span class="mr-2 text-sticker-muted">{{ lang }}</span>{{ render(MESSAGES[lang]) }}
            </p>
          </div>
        </article>
      </div>
    </section>
  </main>
</template>
