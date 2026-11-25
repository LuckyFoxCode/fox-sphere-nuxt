<script setup lang="ts">
// Событие «level up»: бумажная пластина слева + графитовая колонка (анатомия EventSticker, DESIGN 4.5).
// Цвет бумаги один на виджет. Число уровня переворачивается со старого на новый.
const xp = useXpStore();

const shownLvl = ref(0);
let timer: ReturnType<typeof setTimeout> | undefined;
watch(
  () => xp.levelUp,
  (event) => {
    if (!event) return;
    shownLvl.value = event.fromLvl;
    clearTimeout(timer);
    timer = setTimeout(() => (shownLvl.value = event.toLvl), 700);
  },
);
onBeforeUnmount(() => clearTimeout(timer));
</script>

<template>
  <Transition name="sticker-slap">
    <StickerFrame
      v-if="xp.levelUp"
      :key="`${xp.levelUp.twitchId}-${xp.levelUp.toLvl}`"
      class="w-105 gap-x-3 py-2.5 pr-3 pl-2.5"
    >
      <div
        class="flex size-12 shrink-0 items-center justify-center rounded-xl bg-paper-amber text-sticker-body"
      >
        <IconLevelUp class="size-8" />
      </div>
      <div class="flex min-w-0 flex-1 flex-col gap-y-0.5">
        <div class="flex items-center justify-between">
          <span class="text-[10px] font-bold tracking-[0.17em] text-sticker-muted uppercase">
            level up
          </span>
          <span
            class="rounded-md bg-sticker-edge px-1.5 py-0.5 text-[10px] font-bold tracking-[0.17em] text-sticker-body uppercase"
          >
            new
          </span>
        </div>
        <div class="text-4xl leading-tight font-bold">
          lvl <FlipNumber :value="shownLvl" />
        </div>
        <div class="truncate text-xl font-bold">{{ xp.levelUp.username }}</div>
        <div class="text-sm font-medium text-sticker-muted">
          {{ xp.levelUp.fromLvl }} → {{ xp.levelUp.toLvl }}
        </div>
      </div>
    </StickerFrame>
  </Transition>
</template>
