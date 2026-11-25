<script setup lang="ts">
// Число, которое при смене значения переворачивается (Flip, 260 мс): подмена — на середине.
const props = defineProps<{ value: number }>();

const FLIP_MS = 260;
const shown = ref(props.value);
const flipping = ref(false);
let timer: ReturnType<typeof setTimeout> | undefined;

watch(
  () => props.value,
  (next) => {
    flipping.value = false;
    // Перезапуск анимации: класс снимаем и ставим на следующем кадре
    requestAnimationFrame(() => {
      flipping.value = true;
      clearTimeout(timer);
      timer = setTimeout(() => (shown.value = next), FLIP_MS / 2);
    });
  },
);

onBeforeUnmount(() => clearTimeout(timer));
</script>

<template>
  <span
    class="inline-block tabular-nums"
    :class="{ flip: flipping }"
    @animationend="flipping = false"
  >
    {{ shown }}
  </span>
</template>
