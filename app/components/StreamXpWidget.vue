<script setup lang="ts">
// Уровень и XP стрима в шапке: кольцо ранга, «весь XP / порог уровня», процент внутри уровня
// и 40 плоских ячеек. Виден постоянно, как только бот прислал состояние.
const stream = useStreamStore();

const percent = computed(() => {
  const state = stream.state;
  if (!state) return 0;
  const value = ((state.newXp - state.startXp) / (state.maxXp - state.startXp)) * 100;
  return Math.min(Math.max(value, 0), 100);
});

// Как в старой шапке: ячейка и процент округляются вниз
const filled = computed(() => Math.floor((percent.value / 100) * XP_CELLS));

const cellClass = (index: number): string => {
  if (index > filled.value) return 'bg-sticker-track';
  return index === filled.value ? 'bg-sticker-mint' : 'bg-sticker-rose';
};
</script>

<template>
  <StickerFrame v-if="stream.state" class="w-100 gap-x-2.5 py-1 pr-3 pl-2.5">
    <LevelBadge :level="stream.state.lvl" :size="46" />
    <div class="flex flex-1 flex-col justify-center gap-y-1 pr-1.5">
      <div class="flex items-baseline justify-between text-sm font-semibold">
        <span class="text-sticker-muted tabular-nums">{{ stream.state.newXp }} / {{ stream.state.maxXp }} XP</span>
        <span class="text-sticker-mint tabular-nums">{{ Math.floor(percent) }}%</span>
      </div>
      <div class="flex h-2.5 w-full items-center gap-0.5">
        <div
          v-for="index in XP_CELLS"
          :key="index"
          class="h-full flex-1 rounded-xs transition-colors duration-700 ease-out"
          :class="cellClass(index)"
        />
      </div>
    </div>
  </StickerFrame>
</template>
