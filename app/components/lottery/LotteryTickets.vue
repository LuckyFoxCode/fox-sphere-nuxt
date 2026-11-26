<script setup lang="ts">
// Билеты-конфетти лотереи: дождь из бумажных билетов во время розыгрыша и залп из центра в финале.
// Только CSS, живёт, пока показан родитель. Цвета — акценты редкостей рулетки.
const props = defineProps<{ mode: 'rain' | 'burst' }>();

const COLORS = ['#8fc9b8', '#6aa8ff', '#c47bff', '#ffb52e', '#ff5f98', '#f4e8d4'];
const between = (min: number, max: number) => Math.round(min + Math.random() * (max - min));
const pick = () => COLORS[Math.floor(Math.random() * COLORS.length)];

const pieces = computed(() => {
  if (props.mode === 'rain') {
    return Array.from({ length: 34 }, () => ({
      left: `${between(0, 100)}%`,
      '--drift': `${between(-120, 120)}px`,
      '--spin': `${between(-900, 900)}deg`,
      '--delay': `${between(0, 3200)}ms`,
      '--time': `${between(3200, 5200)}ms`,
      background: pick(),
      width: `${between(20, 30)}px`,
      height: `${between(12, 17)}px`,
    }));
  }
  return Array.from({ length: 80 }, (_, index) => {
    const angle = (index / 80) * Math.PI * 2 + Math.random() * 0.3;
    const distance = between(260, 820);
    return {
      '--dx': `${Math.round(Math.cos(angle) * distance)}px`,
      '--dy': `${Math.round(Math.sin(angle) * distance * 0.65 - 100)}px`,
      '--spin': `${between(-900, 900)}deg`,
      '--delay': `${between(0, 180)}ms`,
      '--time': `${between(1700, 2900)}ms`,
      background: pick(),
      width: `${between(20, 30)}px`,
      height: `${between(12, 17)}px`,
    };
  });
});
</script>

<template>
  <div class="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
    <i v-for="(style, index) in pieces" :key="index" :class="mode" :style="style" />
  </div>
</template>

<style scoped>
/* Билет: прямоугольник с вырезами по бокам */
i {
  position: absolute;
  opacity: 0;
  border-radius: 3px;
  -webkit-mask:
    radial-gradient(circle 3.5px at 0 50%, transparent 97%, #000) left / 51% 100% no-repeat,
    radial-gradient(circle 3.5px at 100% 50%, transparent 97%, #000) right / 51% 100% no-repeat;
  mask:
    radial-gradient(circle 3.5px at 0 50%, transparent 97%, #000) left / 51% 100% no-repeat,
    radial-gradient(circle 3.5px at 100% 50%, transparent 97%, #000) right / 51% 100% no-repeat;
}
.rain {
  top: -40px;
  animation: rain var(--time) var(--delay) linear both;
}
.burst {
  top: 46%;
  left: 50%;
  animation: burst var(--time) var(--delay) cubic-bezier(0.12, 0.7, 0.3, 1) both;
}
@keyframes rain {
  0% {
    opacity: 0.9;
    transform: translate(0, 0) rotate3d(1, 0.5, 0.3, 0deg);
  }
  92% {
    opacity: 0.9;
  }
  100% {
    opacity: 0;
    transform: translate(var(--drift), 112vh) rotate3d(1, 0.5, 0.3, var(--spin));
  }
}
@keyframes burst {
  0% {
    opacity: 1;
    transform: translate(0, 0) rotate3d(1, 1, 0, 0deg) scale(0.4);
  }
  70% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translate(var(--dx), calc(var(--dy) + 280px)) rotate3d(1, 1, 0.4, var(--spin)) scale(1);
  }
}
@media (prefers-reduced-motion: reduce) {
  i {
    display: none;
  }
}
</style>
