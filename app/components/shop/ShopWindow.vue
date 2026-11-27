<script setup lang="ts">
// Витрина героев в стиле «графитовых наклеек», как у музыки и шапки стрима. Шрифты крупные: на стриме окно
// читают с экрана телефона. Статы и иконки те же, что в карточке профиля (HP, ATK, DEF, SPD), но на графите
// иконки светлее: шейд 700 с бумаги там не читается. Полоски статов считаются от лучшего героя каталога.
import { HEROES, getHeroStats, type HeroStats } from '#shared/heroes';
import type { ShopShowPayload } from '#shared/events';
import { countPages, pageSlice, SHOP_PAGE_MS } from '~/utils/shopPaging';

const props = defineProps<{ shop: ShopShowPayload }>();

const balance = computed(() => props.shop.coins.toLocaleString('en-US'));

const maxStats = computed<HeroStats>(() => {
  const all = HEROES.map((hero) => getHeroStats(hero.id, 1));
  return {
    health: Math.max(...all.map((stats) => stats.health)),
    attack: Math.max(...all.map((stats) => stats.attack)),
    defense: Math.max(...all.map((stats) => stats.defense)),
    speed: Math.max(...all.map((stats) => stats.speed)),
  };
});

type ShopState = 'equipped' | 'owned' | 'free' | 'affordable' | 'locked';

const cards = computed(() =>
  HEROES.map((hero) => {
    const owned = props.shop.ownedHeroIds.includes(hero.id);
    const state: ShopState = !owned
      ? hero.price === 0
        ? 'free'
        : hero.price <= props.shop.coins
          ? 'affordable'
          : 'locked'
      : props.shop.activeHeroId === hero.id
        ? 'equipped'
        : 'owned';
    return {
      hero,
      state,
      stats: getHeroStats(hero.id, 1),
      shortfall: Math.max(0, hero.price - props.shop.coins),
    };
  }),
);

// Больше трёх героев - страницы, которые сменяются сами; зрители оверлей не листают, он некликабельный
const pageCount = computed(() => countPages(cards.value.length));
const page = ref(0);
const visibleCards = computed(() => pageSlice(cards.value, page.value));
let pager: ReturnType<typeof setInterval> | undefined;
onMounted(() => {
  if (pageCount.value > 1) pager = setInterval(() => (page.value = (page.value + 1) % pageCount.value), SHOP_PAGE_MS);
});
onBeforeUnmount(() => clearInterval(pager));
</script>

<template>
  <StickerFrame class="w-198 flex-col items-stretch gap-y-4 px-5 pt-4 pb-5">
    <div class="flex items-center justify-between gap-x-6">
      <div class="flex items-center gap-x-3 text-2xl font-bold">
        <span class="bg-sticker-edge text-sticker-body flex size-9 items-center justify-center rounded-full">
          <IconStar
            aria-hidden="true"
            class="size-5"
          />
        </span>
        Hero shop
      </div>

      <div
        class="bg-sticker-well border-sticker-edge/25 flex items-center gap-x-2 rounded-xl border px-3.5 py-1.5"
        :aria-label="`${shop.displayName}: ${balance} coins`"
      >
        <IconCoin
          aria-hidden="true"
          class="size-7 text-amber-300"
        />
        <span class="text-2xl leading-none font-extrabold tabular-nums">{{ balance }}</span>
      </div>
    </div>

    <Transition
      name="shop-page"
      mode="out-in"
    >
      <div
        :key="page"
        class="flex justify-center gap-x-4"
      >
        <ShopHeroCard
          v-for="card in visibleCards"
          :key="card.hero.id"
          :hero="card.hero"
          :stats="card.stats"
          :max-stats="maxStats"
          :state="card.state"
          :shortfall="card.shortfall"
          :prefix="shop.prefix"
        />
      </div>
    </Transition>

    <div
      v-if="pageCount > 1"
      class="flex items-center justify-center gap-x-3"
      :aria-label="`page ${page + 1} of ${pageCount}`"
    >
      <span
        v-for="index in pageCount"
        :key="index"
        class="h-3 rounded-full transition-all duration-300"
        :class="index - 1 === page ? 'bg-sticker-edge w-10' : 'bg-sticker-track w-3'"
      />
      <span class="text-sticker-muted ml-1 text-lg font-bold tabular-nums">{{ page + 1 }} / {{ pageCount }}</span>
    </div>
  </StickerFrame>
</template>
