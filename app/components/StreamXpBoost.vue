<script setup lang="ts">
// Чип «×2 · 29:59» под шапкой стрима, слева от карточки музыки. Виден, только пока буст идёт.
// Отступ справа: по умолчанию слева от карточки музыки; сцена, где музыка переехала, задаёт свой
const { right = 'right-86' } = defineProps<{ right?: string }>();
const boost = useBoostStore();

const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
};
</script>

<template>
  <!-- Позиция здесь, а не в родителе, и это лечит сдвиг соседей: `absolute` выводит плашку из
       потока совсем - сдвинуть она не может ничего, даже на кадр.
       `right-[21.5rem]` = 12px отступ + 320px карточка музыки + 12px зазор. Поменяется ширина
       карточки музыки - поправить и здесь. -->
  <Transition name="boost-fade">
    <div v-if="boost.boost" :class="['absolute top-18.5 z-10', right]">
      <StickerFrame
        role="status"
        :aria-label="`Опыт ×${boost.boost.multiplier}, осталось ${formatTime(boost.secondsLeft)}`"
        class="gap-x-2 py-1.5 pr-3 pl-1.5"
      >
        <!-- Бумажная пластина: единственное место, где звучит цвет, молния графитовыми чернилами -->
        <span
          class="flex size-7 shrink-0 items-center justify-center rounded-lg bg-paper-purple"
        >
          <IconLightning class="size-4 text-sticker-body" />
        </span>
        <span class="text-sm font-bold text-sticker-ink tabular-nums"
          >×{{ boost.boost.multiplier }}</span
        >
        <span class="text-xs font-semibold text-sticker-muted tabular-nums">{{
          formatTime(boost.secondsLeft)
        }}</span>
      </StickerFrame>
    </div>
  </Transition>
</template>

<style scoped>
/* Только прозрачность и 200 мс: плашка сообщает, а не зовёт */
.boost-fade-enter-active,
.boost-fade-leave-active {
  transition: opacity 200ms ease;
}

.boost-fade-enter-from,
.boost-fade-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .boost-fade-enter-active,
  .boost-fade-leave-active {
    transition: opacity 1ms;
  }
}
</style>
