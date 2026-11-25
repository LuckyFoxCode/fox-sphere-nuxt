<script setup lang="ts">
// Экран джекпота: вспышка, лучи, конфетти, крупная карточка и выплата, которая набегает на глазах.
const props = defineProps<{ username: string; amount: number; bankAfter: number }>();

const COUNT_DELAY_MS = 700;
const COUNT_MS = 2200;
const shown = ref(0);
let frame = 0;
let timer: ReturnType<typeof setTimeout> | undefined;

onMounted(() => {
  timer = setTimeout(() => {
    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - start) / COUNT_MS, 1);
      shown.value = Math.round(props.amount * (1 - (1 - progress) ** 3));
      if (progress < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
  }, COUNT_DELAY_MS);
});
onBeforeUnmount(() => {
  clearTimeout(timer);
  cancelAnimationFrame(frame);
});

const LETTERS = [...'JACKPOT'];
</script>

<template>
  <div
    class="jackpot absolute inset-0 flex flex-col items-center justify-center font-quicksand"
    role="status"
    :aria-label="`Jackpot: ${username} takes ${amount} coins`"
  >
    <span class="shade" />
    <span class="sunburst" />
    <RouletteConfetti />

    <div class="title relative flex">
      <span
        v-for="(letter, index) in LETTERS"
        :key="index"
        class="letter"
        :style="{ animationDelay: `${120 + index * 70}ms, ${index * -180}ms` }"
      >
        {{ letter }}
      </span>
    </div>

    <div class="hero relative">
      <RouletteCard segment="jackpot" state="win" />
    </div>

    <StickerFrame class="payout relative min-w-105 flex-col gap-y-1 px-8 py-4">
      <span class="max-w-100 truncate text-2xl font-bold">{{ username }}</span>
      <span class="text-[10px] font-bold tracking-[0.17em] text-sticker-muted uppercase">takes the whole bank</span>
      <span class="amount text-6xl leading-none font-bold tabular-nums">+{{ shown.toLocaleString('en-US') }}</span>
      <span class="mt-1 rounded-md bg-sticker-track px-2 py-1 text-xs font-bold">
        bank is back to {{ bankAfter.toLocaleString('en-US') }}
      </span>
    </StickerFrame>

    <span class="whiteout" />
  </div>
</template>

<style scoped>
.shade {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at 50% 48%, rgba(32, 16, 34, 0.88) 0%, rgba(24, 14, 30, 0.62) 38%, transparent 72%);
  animation: fade 300ms ease-out both;
}
.sunburst {
  position: absolute;
  top: 48%;
  left: 50%;
  width: 1700px;
  height: 1700px;
  translate: -50% -50%;
  background: repeating-conic-gradient(rgba(255, 196, 84, 0.34) 0deg 6deg, transparent 6deg 15deg);
  mask-image: radial-gradient(circle, black 6%, transparent 58%);
  animation:
    turn 18s linear infinite,
    fade 500ms ease-out both;
}
/* Отступы с запасом: карточка увеличена масштабом и выступает на ~52px сверху и снизу */
.title {
  margin-bottom: 76px;
  gap: 4px;
}
.letter {
  font-size: 108px;
  font-weight: 700;
  line-height: 1;
  color: #ffd066;
  -webkit-text-stroke: 12px #f4e8d4;
  paint-order: stroke fill;
  /* text-shadow, а не filter: фильтр поверх меняющегося цвета перерисовывался бы каждый кадр */
  text-shadow:
    0 8px 0 #7a2a52,
    0 0 28px rgba(255, 95, 152, 0.8);
  animation:
    drop 620ms cubic-bezier(0.34, 1.56, 0.64, 1) both,
    hue 1.4s linear infinite;
}
.hero {
  margin-bottom: 76px;
  scale: 1.25;
  animation: rise 700ms 350ms cubic-bezier(0.34, 1.56, 0.64, 1) both;
}
.payout {
  animation: rise 500ms 550ms cubic-bezier(0.16, 1, 0.3, 1) both;
}
.amount {
  color: #ffd066;
  text-shadow: 0 3px 0 rgba(0, 0, 0, 0.4);
}
.whiteout {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(ellipse at 50% 48%, #fffdf4, rgba(255, 214, 120, 0.85) 30%, transparent 70%);
  animation: whiteout 900ms ease-out both;
}

@keyframes fade {
  from {
    opacity: 0;
  }
}
@keyframes turn {
  to {
    rotate: 360deg;
  }
}
@keyframes drop {
  from {
    opacity: 0;
    transform: translateY(-120px) scale(2.2);
  }
}
@keyframes hue {
  0%,
  100% {
    color: #ffd066;
  }
  33% {
    color: #ff7fb0;
  }
  66% {
    color: #8ff0d0;
  }
}
@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(40px) scale(0.7);
  }
}
@keyframes whiteout {
  0% {
    opacity: 0;
  }
  12% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .jackpot * {
    animation: none !important;
  }
  .whiteout {
    display: none;
  }
}
</style>
