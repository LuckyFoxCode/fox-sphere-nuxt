<script setup lang="ts">
import type { TimerColor } from '#shared/events';
import { TIMER_PAPER } from '~/utils/timer';

// Одна цифра таймера: тайл из двух половин на бумаге цвета стримера. Смена цифры - переворот
// `rotateX 0 → -90 → 0`; сама цифра подменяется на середине, когда тайл стоит ребром.
const props = defineProps<{ char: string; color: TimerColor }>();

// Длительность держится на одном числе: она уходит в CSS переменной, а подмена цифры
// ждёт ровно половину - JS и анимация не могут разойтись. 260 мс при тике раз в секунду.
const FLIP_MS = 260;
const SWAP_MS = FLIP_MS / 2;

const displayChar = ref(props.char);
const isFlipping = ref(false);
let swapTimer: ReturnType<typeof setTimeout> | undefined;

watch(
  () => props.char,
  (next) => {
    clearTimeout(swapTimer);
    isFlipping.value = true;
    swapTimer = setTimeout(() => (displayChar.value = next), SWAP_MS);
  },
);

onBeforeUnmount(() => clearTimeout(swapTimer));
</script>

<template>
  <div
    class="relative inline-flex h-18.75 w-11 shrink-0 flex-col select-none perspective-near"
    :class="{ 'is-flipping': isFlipping }"
    :style="{ '--flip-ms': `${FLIP_MS}ms` }"
    @animationend="isFlipping = false"
  >
    <div class="relative flex h-1/2 w-full justify-center overflow-hidden rounded-t-[9px]" :class="TIMER_PAPER[color]">
      <span
        class="absolute top-0 left-1/2 flex h-18.75 -translate-x-1/2 items-center text-5xl leading-none font-bold text-sticker-body tabular-nums"
      >
        {{ displayChar }}
      </span>
    </div>
    <div class="relative flex h-1/2 w-full justify-center overflow-hidden rounded-b-[9px]" :class="TIMER_PAPER[color]">
      <span
        class="absolute bottom-0 left-1/2 flex h-18.75 -translate-x-1/2 items-center text-5xl leading-none font-bold text-sticker-body tabular-nums"
      >
        {{ displayChar }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.is-flipping {
  animation: flip var(--flip-ms, 260ms) ease-in-out;
}

@media (prefers-reduced-motion: reduce) {
  .is-flipping {
    animation: none;
  }
}
</style>
