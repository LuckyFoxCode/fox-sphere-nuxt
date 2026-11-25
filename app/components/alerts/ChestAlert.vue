<script setup lang="ts">
// Алерт «сундук из рыбалки»: сундук дрожит, откидывает крышку, из него бьёт свет и вылетают монеты,
// под ним золотая наклейка с ником и суммой в банк. Золото и свечение — как у карточек рулетки, но
// всё держится вокруг наклейки: затемнения, лучей и конфетти на весь кадр нет, это приём джекпота.
// Все кадры начинаются при появлении: родитель задаёт :key на каждый показ.
defineProps<{ label: string; username: string; amount: string }>();

// Монеты из сундука: dx — куда улетает вбок, up — высота дуги, down — где гаснет (px от горловины)
const COINS = [
  { dx: -168, up: 62, down: 66, size: 26, delay: 0 },
  { dx: -128, up: 112, down: 30, size: 20, delay: 90 },
  { dx: -78, up: 138, down: 8, size: 24, delay: 30 },
  { dx: -30, up: 152, down: -52, size: 17, delay: 160 },
  { dx: 38, up: 146, down: -40, size: 22, delay: 60 },
  { dx: 86, up: 130, down: 12, size: 18, delay: 190 },
  { dx: 134, up: 104, down: 36, size: 25, delay: 20 },
  { dx: 172, up: 54, down: 70, size: 19, delay: 120 },
  { dx: -104, up: 66, down: 80, size: 16, delay: 230 },
  { dx: 108, up: 72, down: 78, size: 16, delay: 260 },
];

// Искры веером вверх: дальность и размер чередуются
const SPARK_COUNT = 18;
const SPARKS = Array.from({ length: SPARK_COUNT }, (_, index) => {
  const angle = Math.PI * (1.04 - (index / (SPARK_COUNT - 1)) * 1.08);
  const distance = 104 + ((index * 41) % 76);
  return {
    '--dx': `${Math.round(Math.cos(angle) * distance * 1.2)}px`,
    '--dy': `${Math.round(-Math.sin(angle) * distance)}px`,
    '--size': `${8 + ((index * 5) % 10)}px`,
    '--delay': `${920 + (index % 5) * 35}ms`,
  };
});

// Мерцание вокруг открытого сундука, пока алерт на экране
const TWINKLES = [
  { x: 82, y: 40, size: 16, delay: 0 },
  { x: 330, y: 28, size: 13, delay: 0.5 },
  { x: 118, y: 8, size: 10, delay: 1.1 },
  { x: 356, y: 96, size: 11, delay: 0.8 },
  { x: 62, y: 112, size: 9, delay: 1.4 },
  { x: 268, y: 4, size: 8, delay: 0.25 },
];
</script>

<template>
  <div
    class="chest-alert relative flex w-105 flex-col items-center"
    role="status"
    :aria-label="`${label} — ${username} — ${amount}`"
  >
    <div class="stage" aria-hidden="true">
      <span class="beam" />
      <span class="flash" />
      <div class="shaker">
        <ChestArt class="chest" />
      </div>

      <span class="mouth">
        <i v-for="(style, index) in SPARKS" :key="`s${index}`" class="spark" :class="{ pale: index % 3 === 0 }" :style="style" />
        <span
          v-for="(coin, index) in COINS"
          :key="`c${index}`"
          class="coin"
          :style="{
            '--dx': `${coin.dx}px`,
            '--up': `${-coin.up}px`,
            '--down': `${coin.down}px`,
            '--size': `${coin.size}px`,
            '--delay': `${940 + coin.delay}ms`,
          }"
        >
          <span class="coin-arc">
            <svg viewBox="-12 -12 24 24">
              <circle r="10.5" fill="#e79a35" stroke="#2b2630" stroke-width="2" />
              <circle r="6.5" fill="#ffd066" />
              <path d="M-7-2A7.5 7.5 0 0 1-2-7" fill="none" stroke="#fff1bd" stroke-width="2" stroke-linecap="round" />
            </svg>
          </span>
        </span>
      </span>

      <svg
        v-for="(spot, index) in TWINKLES"
        :key="`t${index}`"
        class="twinkle"
        viewBox="-10 -10 20 20"
        :style="{
          left: `${spot.x}px`,
          top: `${spot.y}px`,
          width: `${spot.size}px`,
          height: `${spot.size}px`,
          animationDelay: `${1.5 + spot.delay}s`,
        }"
      >
        <path d="M0-10L2.4-2.4L10 0L2.4 2.4L0 10L-2.4 2.4L-10 0L-2.4-2.4Z" />
      </svg>
    </div>

    <div class="plate">
      <span class="grain" />
      <div class="relative flex w-full flex-col items-center gap-y-1.5 px-4 pt-5 pb-3">
        <span class="max-w-full truncate text-xl leading-tight font-bold">{{ username }}</span>
        <span class="amount">{{ amount }}</span>
      </div>
      <div class="ribbon">
        <i v-for="pip in 2" :key="`l${pip}`" />
        <span class="truncate">{{ label }}</span>
        <i v-for="pip in 2" :key="`r${pip}`" />
      </div>
      <span class="foil" />
    </div>
  </div>
</template>

<style>
/* Угол золотого канта: без @property градиент не анимируется */
@property --chest-angle {
  syntax: '<angle>';
  inherits: false;
  initial-value: 0deg;
}
</style>

<style scoped>
.chest-alert {
  /* Кириллицы в Quicksand нет: украинские и русские подписи берут Rubik */
  font-family: 'Quicksand Variable', 'Rubik Variable', sans-serif;
  color: var(--sticker-ink);
}

/* --- Сцена с сундуком ------------------------------------------------------------------ */
.stage {
  position: relative;
  z-index: 1;
  display: flex;
  width: 100%;
  height: 156px;
  justify-content: center;
  /* Сундук стоит на наклейке, а не висит над ней */
  margin-bottom: -16px;
}

.shaker {
  position: relative;
  transform-origin: 50% 94%;
  animation: rattle 1300ms 120ms ease-in-out both;
}
.chest {
  display: block;
  width: 214px;
  height: 156px;
  overflow: visible;
  filter: drop-shadow(0 7px 5px rgba(0, 0, 0, 0.4));
}

/* Горловина сундука: отсюда летят искры и монеты */
.mouth {
  position: absolute;
  top: 76px;
  left: 50%;
  pointer-events: none;
}

.flash {
  position: absolute;
  top: 74px;
  left: 50%;
  width: 380px;
  height: 260px;
  translate: -50% -50%;
  border-radius: 999px;
  background: radial-gradient(closest-side, #fffbea, rgba(255, 208, 102, 0.75) 36%, transparent);
  opacity: 0;
  pointer-events: none;
  animation: flash 700ms 910ms ease-out both;
}

/* Столб света из открытого сундука */
.beam {
  position: absolute;
  bottom: 70px;
  left: 50%;
  width: 300px;
  height: 150px;
  translate: -50% 0;
  background: linear-gradient(0deg, rgba(255, 214, 110, 0.85), rgba(255, 190, 60, 0.28) 55%, transparent);
  clip-path: polygon(34% 100%, 66% 100%, 100% 0, 0 0);
  mask-image: linear-gradient(90deg, transparent, black 30%, black 70%, transparent);
  transform-origin: 50% 100%;
  opacity: 0.6;
  pointer-events: none;
  animation:
    beam-in 600ms 930ms cubic-bezier(0.16, 1, 0.3, 1) both,
    beam-breathe 1.8s 1530ms ease-in-out infinite;
}

.spark {
  position: absolute;
  width: var(--size);
  height: var(--size);
  translate: -50% -50%;
  background: #ffc23d;
  clip-path: polygon(50% 0, 62% 38%, 100% 50%, 62% 62%, 50% 100%, 38% 62%, 0 50%, 38% 38%);
  opacity: 0;
  animation: spark 1100ms var(--delay) cubic-bezier(0.1, 0.7, 0.3, 1) both;
}
.spark.pale {
  background: #fff3cf;
}

/* Дуга: по горизонтали монета летит ровно, по вертикали взлетает и падает */
.coin {
  position: absolute;
  width: var(--size);
  height: var(--size);
  translate: -50% -50%;
  opacity: 0;
  animation: coin-drift 1250ms var(--delay) linear both;
}
.coin-arc {
  display: block;
  animation: coin-arc 1250ms var(--delay) both;
}
.coin svg {
  display: block;
  width: var(--size);
  height: var(--size);
  animation: coin-flip 420ms var(--delay) linear infinite;
}

.twinkle {
  position: absolute;
  translate: -50% -50%;
  fill: #fff1bd;
  opacity: 0;
  pointer-events: none;
  animation: twinkle 1.9s ease-in-out infinite;
}

/* --- Золотая наклейка ------------------------------------------------------------------ */
.plate {
  position: relative;
  display: flex;
  width: 100%;
  flex-direction: column;
  align-items: center;
  overflow: hidden;
  border: 4px solid transparent;
  border-radius: 20px;
  background:
    linear-gradient(180deg, color-mix(in oklab, #ffb52e 28%, var(--sticker-body)), var(--sticker-body) 72%)
      padding-box,
    conic-gradient(from var(--chest-angle), #fff3c4, #ffb52e, #b8681a, #ffd66b, #fffbe6, #e8901f, #fff3c4)
      border-box;
  box-shadow:
    0 10px 24px rgba(0, 0, 0, 0.45),
    0 0 26px rgba(255, 181, 46, 0.5);
  animation:
    spin-angle 3.6s linear infinite,
    plate-hit 520ms 930ms ease-out;
}
.grain {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image: radial-gradient(var(--sticker-edge) 0.6px, transparent 0.6px);
  background-size: 3px 3px;
  opacity: 0.12;
}
.amount {
  max-width: 100%;
  font-size: 30px;
  font-weight: 700;
  line-height: 1.1;
  text-align: center;
  font-variant-numeric: tabular-nums;
  color: #ffd066;
  text-shadow: 0 3px 0 rgba(0, 0, 0, 0.4);
  animation: amount-pop 560ms 1100ms cubic-bezier(0.34, 1.56, 0.64, 1) both;
}
.ribbon {
  position: relative;
  display: flex;
  width: 100%;
  height: 28px;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 0 12px;
  background: linear-gradient(90deg, #ffb52e, #ffe08a 50%, #ffb52e);
  color: var(--sticker-body);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.17em;
  line-height: 1;
  text-transform: uppercase;
}
.ribbon span {
  padding: 0 6px;
}
.ribbon i {
  width: 6px;
  height: 6px;
  flex-shrink: 0;
  background: var(--sticker-body);
  transform: rotate(45deg);
}
/* Блик по фольге после открытия */
.foil {
  position: absolute;
  inset: -40% -60%;
  pointer-events: none;
  background: linear-gradient(
    112deg,
    transparent 43%,
    rgba(255, 255, 255, 0.1) 46%,
    rgba(255, 255, 255, 0.42) 50%,
    rgba(255, 255, 255, 0.1) 54%,
    transparent 57%
  );
  mix-blend-mode: soft-light;
  transform: translateX(-55%);
  animation: foil 2.6s 1.2s ease-in-out infinite;
}

/* --- Кадры ----------------------------------------------------------------------------- */
/* 120–800 мс дрожь по нарастающей, на открытии — приседание и прыжок */
@keyframes rattle {
  0%,
  100% {
    transform: none;
  }
  8% {
    transform: rotate(-2deg);
  }
  15% {
    transform: rotate(2deg);
  }
  22% {
    transform: rotate(-3.5deg);
  }
  29% {
    transform: rotate(3.5deg) translateY(-2px);
  }
  36% {
    transform: rotate(-5.5deg) translateY(-3px);
  }
  43% {
    transform: rotate(5.5deg) translateY(-3px);
  }
  50% {
    transform: rotate(-3deg);
  }
  57% {
    transform: scale(1.12, 0.86);
  }
  68% {
    transform: scale(0.92, 1.12) translateY(-8px);
  }
  80% {
    transform: scale(1.05, 0.96);
  }
  90% {
    transform: scale(0.99, 1.01);
  }
}
@keyframes flash {
  0% {
    opacity: 0;
    scale: 0.4;
  }
  16% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    scale: 1.15;
  }
}
@keyframes beam-in {
  from {
    opacity: 0;
    transform: scale(0.4, 0);
  }
  to {
    opacity: 0.6;
  }
}
@keyframes beam-breathe {
  50% {
    opacity: 0.34;
    transform: scaleX(0.86);
  }
}
@keyframes spark {
  0% {
    opacity: 0;
    transform: translate(0, 0) scale(0.4) rotate(0);
  }
  10% {
    opacity: 1;
  }
  70% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translate(var(--dx), calc(var(--dy) + 22px)) scale(1.2) rotate(150deg);
  }
}
@keyframes coin-drift {
  0% {
    opacity: 0;
    transform: translateX(0);
  }
  8% {
    opacity: 1;
  }
  80% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translateX(var(--dx));
  }
}
@keyframes coin-arc {
  0% {
    transform: translateY(0);
    animation-timing-function: cubic-bezier(0.2, 0.7, 0.45, 1);
  }
  52% {
    transform: translateY(var(--up));
    animation-timing-function: cubic-bezier(0.55, 0, 0.85, 0.4);
  }
  100% {
    transform: translateY(var(--down));
  }
}
@keyframes coin-flip {
  50% {
    transform: scaleX(0.15);
  }
}
@keyframes twinkle {
  0%,
  100% {
    opacity: 0;
    scale: 0.4;
  }
  50% {
    opacity: 1;
    scale: 1.15;
  }
}
@keyframes spin-angle {
  to {
    --chest-angle: 360deg;
  }
}
@keyframes plate-hit {
  0% {
    transform: none;
  }
  30% {
    transform: translateY(6px) scale(1.03, 0.96);
  }
  100% {
    transform: none;
  }
}
@keyframes amount-pop {
  from {
    opacity: 0;
    transform: scale(0.4);
  }
}
@keyframes foil {
  0%,
  30% {
    transform: translateX(-55%);
  }
  75%,
  100% {
    transform: translateX(55%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .chest-alert,
  .chest-alert * {
    animation: none !important;
  }
  .flash,
  .spark,
  .coin,
  .twinkle,
  .foil {
    display: none;
  }
}
</style>
