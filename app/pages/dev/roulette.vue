<script setup lang="ts">
// Превью дизайна рулетки: все карточки призов, их выигрыш и экран джекпота.
// К сокету не подключается, поэтому на стрим ничего не уходит.
import {
  ROULETTE_PRIZE_WEIGHTS,
  ROULETTE_SEGMENT_IDS,
  ROULETTE_SEGMENT_RARITY,
  ROULETTE_TOTAL_WEIGHT,
  type RouletteSegmentId,
} from '#shared/roulette';
import { RARITY_STYLES } from '~/utils/roulette/rarity';

useHead({ title: 'Рулетка: карточки' });

const RARITY_ORDER = Object.keys(RARITY_STYLES) as (keyof typeof RARITY_STYLES)[];
// Слева направо от пустой к джекпоту
const ordered = [...ROULETTE_SEGMENT_IDS].sort(
  (a, b) => RARITY_ORDER.indexOf(ROULETTE_SEGMENT_RARITY[a]) - RARITY_ORDER.indexOf(ROULETTE_SEGMENT_RARITY[b]),
);

const chance = (id: RouletteSegmentId) =>
  `${((ROULETTE_PRIZE_WEIGHTS[id] / ROULETTE_TOTAL_WEIGHT) * 100).toLocaleString('ru-RU')} %`;

// По одной карточке каждой редкости в состоянии выигрыша
const winners: RouletteSegmentId[] = ['empty', 'coins75', 'coins100', 'coins250', 'coins1000', 'jackpot'];
const replay = ref(0);

const tape: RouletteSegmentId[] = ['coins60', 'xp100', 'coins500', 'empty', 'coins100'];

const jackpot = ref(false);
let jackpotTimer: ReturnType<typeof setTimeout> | undefined;
const showJackpot = () => {
  clearTimeout(jackpotTimer);
  jackpot.value = false;
  nextTick(() => (jackpot.value = true));
  jackpotTimer = setTimeout(() => (jackpot.value = false), 8000);
};
onBeforeUnmount(() => clearTimeout(jackpotTimer));

// ?freeze — для снимков: выигрыш показан без повторов
const route = useRoute();
onMounted(() => {
  if (route.query.jackpot !== undefined) showJackpot();
});
</script>

<template>
  <main class="stage min-h-screen min-w-[1860px] px-8 py-7 font-quicksand text-sticker-ink">
    <header class="flex items-center gap-x-4">
      <h1 class="text-2xl font-bold">Рулетка: карточки призов</h1>
      <button class="rounded-lg bg-sticker-edge px-3 py-2 font-bold text-sticker-body" @click="replay++">
        Повторить выигрыш
      </button>
      <button class="rounded-lg bg-sticker-edge px-3 py-2 font-bold text-sticker-body" @click="showJackpot">
        Показать джекпот
      </button>
    </header>

    <h2 class="mt-6 text-xs font-bold tracking-[0.17em] text-sticker-muted uppercase">Все слоты ленты, от пустой к джекпоту</h2>
    <div class="mt-5 flex justify-between">
      <figure v-for="id in ordered" :key="id" class="flex flex-col items-center gap-y-3">
        <RouletteCard :segment="id" />
        <figcaption class="text-sm font-semibold text-sticker-muted">{{ chance(id) }}</figcaption>
      </figure>
    </div>

    <h2 class="mt-8 text-xs font-bold tracking-[0.17em] text-sticker-muted uppercase">Выигрыш: момент остановки</h2>
    <div :key="replay" class="mt-16 flex justify-between px-16">
      <RouletteCard v-for="id in winners" :key="id" :segment="id" state="win" />
    </div>

    <h2 class="mt-28 text-xs font-bold tracking-[0.17em] text-sticker-muted uppercase">Так это выглядит на ленте</h2>
    <div :key="`tape-${replay}`" class="mt-14 mb-24 flex justify-center gap-x-4">
      <RouletteCard v-for="(id, index) in tape" :key="index" :segment="id" :state="index === 2 ? 'win' : 'dim'" />
    </div>

    <div v-if="jackpot" class="fixed inset-0 z-50" @click="jackpot = false">
      <RouletteJackpot username="LuckyViewer" :amount="11540" :bank-after="1000" />
    </div>
  </main>
</template>

<style scoped>
/* Тёмный «геймплей» за оверлеем: на нём видно кант, тень и свечение */
.stage {
  background:
    radial-gradient(circle at 18% 12%, #2d3b52, transparent 46%),
    radial-gradient(circle at 82% 78%, #3a2b45, transparent 52%),
    #151922;
}
</style>
