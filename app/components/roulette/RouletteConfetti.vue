<script setup lang="ts">
// Конфетти джекпота: залп из центра и два дождя следом. Только CSS, живёт, пока показан родитель.
const COLORS = ['#ff5f98', '#ffb52e', '#fff3a6', '#6ff0c8', '#6aa8ff', '#c47bff', '#f4e8d4'];

const between = (min: number, max: number) => Math.round(min + Math.random() * (max - min));
const pick = () => COLORS[Math.floor(Math.random() * COLORS.length)];

const burst = Array.from({ length: 90 }, (_, index) => {
  const angle = (index / 90) * Math.PI * 2 + Math.random() * 0.4;
  const distance = between(220, 760);
  return {
    '--dx': `${Math.round(Math.cos(angle) * distance)}px`,
    '--dy': `${Math.round(Math.sin(angle) * distance * 0.7 - 120)}px`,
    '--spin': `${between(-900, 900)}deg`,
    '--delay': `${between(0, 160)}ms`,
    '--time': `${between(1500, 2600)}ms`,
    background: pick(),
    width: `${between(8, 15)}px`,
    height: `${between(8, 22)}px`,
  };
});

const rain = Array.from({ length: 130 }, () => ({
  left: `${between(0, 100)}%`,
  '--drift': `${between(-140, 140)}px`,
  '--spin': `${between(-1100, 1100)}deg`,
  '--delay': `${between(500, 4200)}ms`,
  '--time': `${between(2400, 4400)}ms`,
  background: pick(),
  width: `${between(7, 13)}px`,
  height: `${between(10, 22)}px`,
}));
</script>

<template>
  <div class="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
    <i v-for="(style, index) in burst" :key="`b${index}`" class="burst" :class="{ round: index % 5 === 0 }" :style="style" />
    <i v-for="(style, index) in rain" :key="`r${index}`" class="rain" :class="{ round: index % 7 === 0 }" :style="style" />
  </div>
</template>

<style scoped>
i {
  position: absolute;
  border-radius: 2px;
  opacity: 0;
}
.round {
  border-radius: 999px;
}
.burst {
  top: 45%;
  left: 50%;
  animation: confetti-burst var(--time) var(--delay) cubic-bezier(0.12, 0.7, 0.3, 1) both;
}
.rain {
  top: -30px;
  animation: confetti-rain var(--time) var(--delay) linear both;
}
@keyframes confetti-burst {
  0% {
    opacity: 1;
    transform: translate(0, 0) rotate3d(1, 1, 0, 0deg) scale(0.4);
  }
  70% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translate(var(--dx), calc(var(--dy) + 260px)) rotate3d(1, 1, 0.4, var(--spin)) scale(1);
  }
}
@keyframes confetti-rain {
  0% {
    opacity: 1;
    transform: translate(0, 0) rotate3d(1, 0.6, 0.3, 0deg);
  }
  90% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translate(var(--drift), 115vh) rotate3d(1, 0.6, 0.3, var(--spin));
  }
}
@media (prefers-reduced-motion: reduce) {
  i {
    display: none;
  }
}
</style>
