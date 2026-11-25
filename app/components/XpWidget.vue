<script setup lang="ts">
// XP зрителя: ячейки по 40 штук (Flat-Cell), заполненные розовые, ведущая — мятная.
const xp = useXpStore();

const view = computed(() => {
  const gain = xp.gain;
  if (!gain) return null;
  const { current, span, ratio } = xpProgress(gain.totalXp, gain.lvl);
  return { gain, current, span, percent: Math.round(ratio * 100), target: filledCells(ratio) };
});

// Полоса сначала стоит на значении «до начисления», затем доезжает до нового
const filled = ref(0);
let timer: ReturnType<typeof setTimeout> | undefined;
watch(
  () => xp.gain,
  (gain) => {
    if (!gain) return;
    const before = xpProgress(Math.max(0, gain.totalXp - gain.amount), gain.lvl);
    filled.value = filledCells(before.ratio);
    clearTimeout(timer);
    timer = setTimeout(() => (filled.value = filledCells(xpProgress(gain.totalXp, gain.lvl).ratio)), 150);
  },
  { immediate: true },
);
onBeforeUnmount(() => clearTimeout(timer));

const cellClass = (index: number): string => {
  if (index >= filled.value) return 'bg-sticker-track';
  return index === filled.value - 1 ? 'bg-sticker-mint' : 'bg-sticker-rose';
};
</script>

<template>
  <Transition name="sticker-slap">
    <StickerFrame
      v-if="xp.gainVisible && view"
      class="w-100 gap-x-2.5 py-1 pr-3 pl-2.5"
    >
      <div
        class="flex size-11.5 shrink-0 items-center justify-center rounded-full border-2 border-sticker-edge bg-sticker-well text-lg font-bold tabular-nums"
      >
        {{ view.gain.lvl }}
      </div>
      <div class="flex min-w-0 flex-1 flex-col gap-y-1">
        <div class="flex items-center justify-between gap-x-2">
          <span class="truncate text-sm font-semibold">{{ view.gain.username }}</span>
          <span
            class="shrink-0 rounded-md bg-sticker-track px-1.5 py-0.5 text-xs font-bold tabular-nums"
          >
            +{{ view.gain.amount }} XP
          </span>
        </div>
        <div class="flex items-center justify-between text-[10px] font-bold tracking-[0.17em] uppercase">
          <span class="text-sticker-muted tabular-nums">{{ view.current }} / {{ view.span }} XP</span>
          <span class="text-sticker-mint tabular-nums">{{ view.percent }}%</span>
        </div>
        <div class="flex h-2.5 gap-x-0.5">
          <div
            v-for="index in XP_CELLS"
            :key="index"
            class="h-full flex-1 rounded-xs transition-colors duration-700"
            :class="cellClass(index - 1)"
          />
        </div>
      </div>
    </StickerFrame>
  </Transition>
</template>
