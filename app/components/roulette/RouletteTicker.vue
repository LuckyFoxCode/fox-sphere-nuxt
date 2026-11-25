<script setup lang="ts">
// Банк рулетки в шапке, перенесён из старого fox-sphere: колесо, «take bank», сумма и чип !spin.
// Пока бот не прислал банк, на месте суммы заглушка.
const bank = useBankStore();
</script>

<template>
  <StickerFrame role="status" aria-label="Take the roulette bank — command !spin" class="gap-x-2.5 py-1 pr-2 pl-2.5">
    <IconLotteryWheel aria-hidden="true" class="wheel size-7 shrink-0 text-sticker-rose" />

    <!-- Высота ряда равна кольцу ранга в соседней XP-наклейке: обе стоят вровень -->
    <div class="relative flex h-11.5 flex-col justify-center leading-none">
      <span class="text-[10px] font-bold tracking-[0.17em] text-sticker-muted uppercase">take bank</span>
      <span v-if="bank.total === null" aria-hidden="true" class="mt-1 block h-4 w-14 animate-pulse rounded bg-sticker-track" />
      <Transition v-else name="reel" mode="out-in">
        <span :key="bank.total" class="mt-1 text-lg leading-none font-bold tabular-nums">
          {{ bank.total.toLocaleString('en-US') }}
        </span>
      </Transition>
    </div>

    <span class="ml-0.5 rounded-lg bg-sticker-edge px-2 py-0.5 text-sm font-bold tracking-wide text-sticker-body">
      !spin
    </span>
  </StickerFrame>
</template>

<style scoped>
.wheel {
  animation: wheel 4s linear infinite;
}
@keyframes wheel {
  to {
    rotate: 360deg;
  }
}

/* Смена суммы: 140 мс вверх-вниз с размытием (DESIGN.md 2.4) */
.reel-enter-active,
.reel-leave-active {
  transition:
    opacity 140ms cubic-bezier(0.16, 1, 0.3, 1),
    transform 140ms cubic-bezier(0.16, 1, 0.3, 1),
    filter 140ms cubic-bezier(0.16, 1, 0.3, 1);
}
.reel-enter-from {
  opacity: 0;
  transform: translateY(0.45em);
  filter: blur(2px);
}
.reel-leave-to {
  opacity: 0;
  transform: translateY(-0.45em);
  filter: blur(2px);
}

@media (prefers-reduced-motion: reduce) {
  .wheel {
    animation: none;
  }
}
</style>
