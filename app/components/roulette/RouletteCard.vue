<script setup lang="ts">
// Карточка приза рулетки: коллекционная наклейка. Основа графитовая, редкость читается по цвету,
// канту, фактуре окна с картинкой, свечению, ромбикам и анимации выигрыша.
import type { RouletteSegmentId } from '#shared/roulette';
import { segmentView } from '~/utils/roulette/rarity';

const props = withDefaults(
  defineProps<{
    segment: RouletteSegmentId;
    /** win — выигравшая карточка, dim — соседи после остановки */
    state?: 'idle' | 'win' | 'dim';
  }>(),
  { state: 'idle' },
);

const view = computed(() => segmentView(props.segment));

// Искры по краям окна: места заданы заранее, чтобы картинка не прыгала между рендерами
const TWINKLE_SPOTS = [
  { x: 12, y: 18, size: 12, delay: 0 },
  { x: 84, y: 66, size: 9, delay: 0.7 },
  { x: 78, y: 12, size: 8, delay: 1.3 },
  { x: 10, y: 74, size: 8, delay: 1.9 },
  { x: 48, y: 8, size: 7, delay: 0.4 },
  { x: 92, y: 38, size: 10, delay: 1.6 },
  { x: 24, y: 48, size: 6, delay: 1.1 },
] as const;
const twinkles = computed(() => TWINKLE_SPOTS.slice(0, view.value.style.twinkles));

// Частицы выигрыша: по кругу, дальность и размер чередуются
const particles = computed(() => {
  const count = view.value.style.burst;
  return Array.from({ length: count }, (_, index) => {
    const angle = (index / count) * Math.PI * 2 + (index % 2 ? 0.12 : -0.08);
    const distance = 118 + ((index * 37) % 62);
    return {
      '--dx': `${Math.round(Math.cos(angle) * distance)}px`,
      '--dy': `${Math.round(Math.sin(angle) * distance * 1.15)}px`,
      '--size': `${6 + ((index * 5) % 8)}px`,
      '--delay': `${(index % 5) * 28}ms`,
    };
  });
});
</script>

<template>
  <div
    class="roulette-card font-quicksand"
    :class="[`rarity-${view.rarity}`, `is-${state}`]"
    :style="{ '--accent': view.style.accent }"
    role="img"
    :aria-label="`${view.style.label}: ${view.value} ${view.unit}`"
  >
    <template v-if="state === 'win'">
      <span class="ring" />
      <span class="ring ring-late" />
      <span class="burst">
        <i v-for="(style, index) in particles" :key="index" :class="{ alt: index % 3 === 0 }" :style="style" />
        <template v-if="view.rarity === 'empty'"><b v-for="puff in 5" :key="puff" :class="`puff-${puff}`" /></template>
      </span>
    </template>

    <div class="face">
      <div class="window">
        <span class="texture" />
        <span v-if="view.rarity === 'legendary' || view.rarity === 'jackpot'" class="rays" />
        <span class="halo" />
        <RouletteArt :segment="segment" class="art" />
        <svg
          v-for="(spot, index) in twinkles"
          :key="index"
          class="twinkle"
          viewBox="-10 -10 20 20"
          aria-hidden="true"
          :style="{
            left: `${spot.x}%`,
            top: `${spot.y}%`,
            width: `${spot.size}px`,
            height: `${spot.size}px`,
            animationDelay: `${spot.delay}s`,
          }"
        >
          <path d="M0-10L2.4-2.4L10 0L2.4 2.4L0 10L-2.4 2.4L-10 0L-2.4-2.4Z" />
        </svg>
      </div>

      <div class="value">{{ view.value }}</div>
      <div class="unit">{{ view.unit }}</div>

      <div class="ribbon">
        <span>{{ view.style.label }}</span>
        <span v-if="view.style.pips" class="pips">
          <i v-for="pip in view.style.pips" :key="pip" />
        </span>
      </div>

      <span class="grain" />
      <span class="foil" />
      <span v-if="state === 'win'" class="flash" />
    </div>
  </div>
</template>

<style>
/* Угол радужного канта и лучей: без @property градиент не анимируется */
@property --roulette-angle {
  syntax: '<angle>';
  inherits: false;
  initial-value: 0deg;
}
</style>

<style scoped>
.roulette-card {
  --glow: 0px;
  --glow-alpha: 0%;
  position: relative;
  width: 164px;
  height: 232px;
  flex-shrink: 0;
  color: var(--sticker-ink);
  transition:
    transform 420ms cubic-bezier(0.34, 1.56, 0.64, 1),
    opacity 300ms ease,
    filter 300ms ease;
}

/* --- Корпус ---------------------------------------------------------------------------- */
.face {
  position: relative;
  display: flex;
  height: 100%;
  flex-direction: column;
  align-items: center;
  overflow: hidden;
  border: 3px solid var(--edge, var(--sticker-edge));
  border-radius: 20px;
  background:
    linear-gradient(180deg, color-mix(in oklab, var(--accent) 16%, var(--sticker-body)), var(--sticker-body) 70%);
  box-shadow:
    0 10px 24px rgba(0, 0, 0, 0.45),
    0 0 var(--glow) color-mix(in oklab, var(--accent) var(--glow-alpha), transparent);
}

.grain {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image: radial-gradient(var(--sticker-edge) 0.6px, transparent 0.6px);
  background-size: 3px 3px;
  opacity: 0.12;
}

.window {
  position: relative;
  display: flex;
  width: calc(100% - 14px);
  height: 128px;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  margin-top: 7px;
  overflow: hidden;
  border-radius: 13px;
  background: color-mix(in oklab, var(--accent) 24%, var(--sticker-well));
  box-shadow: inset 0 0 0 1.5px color-mix(in oklab, var(--accent) 55%, transparent);
}

.texture,
.rays,
.halo {
  position: absolute;
  inset: 0;
}

.halo {
  background: radial-gradient(circle at 50% 54%, color-mix(in oklab, var(--accent) 62%, transparent), transparent 62%);
}

.art {
  position: relative;
  width: 112px;
  height: 112px;
  filter: drop-shadow(0 5px 4px rgba(0, 0, 0, 0.38));
}

.value {
  position: relative;
  margin-top: 8px;
  font-size: 34px;
  font-weight: 700;
  line-height: 1;
  font-variant-numeric: tabular-nums;
  text-shadow: 0 2px 0 rgba(0, 0, 0, 0.35);
}

.unit {
  position: relative;
  margin-top: 4px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.17em;
  line-height: 1;
  text-transform: uppercase;
  color: color-mix(in oklab, var(--accent) 45%, var(--sticker-ink));
}

.ribbon {
  position: relative;
  display: flex;
  width: 100%;
  height: 31px;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
  padding: 0 11px;
  background: var(--accent);
  color: var(--sticker-body);
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.17em;
  line-height: 1;
  text-transform: uppercase;
}

.pips {
  display: flex;
  gap: 3px;
}
.pips i {
  width: 6px;
  height: 6px;
  background: var(--sticker-body);
  transform: rotate(45deg);
}

.twinkle {
  position: absolute;
  translate: -50% -50%;
  fill: #fff8e4;
  animation: twinkle 2.4s ease-in-out infinite;
}

/* Блик по фольге: только у эпических и выше */
.foil {
  position: absolute;
  inset: -40% -80%;
  display: none;
  pointer-events: none;
  background: linear-gradient(
    112deg,
    transparent 43%,
    rgba(255, 255, 255, 0.08) 46%,
    rgba(255, 255, 255, 0.34) 50%,
    rgba(255, 255, 255, 0.08) 54%,
    transparent 57%
  );
  mix-blend-mode: soft-light;
  animation: foil 3.6s ease-in-out infinite;
}

/* --- Редкости -------------------------------------------------------------------------- */
/* Пусто: матовая, пунктирная, без цвета и блеска */
.rarity-empty .face {
  --edge: #6d6578;
  border-style: dashed;
  background: var(--sticker-body);
}
.rarity-empty .window {
  background: var(--sticker-well);
  box-shadow: none;
}
.rarity-empty .texture {
  background: repeating-linear-gradient(45deg, rgba(220, 203, 178, 0.08) 0 2px, transparent 2px 9px);
}
.rarity-empty .halo {
  display: none;
}
.rarity-empty .value,
.rarity-empty .unit {
  color: var(--sticker-muted);
}
.rarity-empty .ribbon {
  justify-content: center;
  background: var(--sticker-track);
  color: var(--sticker-muted);
}

/* Обычный: овсяный кант, горошек */
.rarity-common .texture {
  background-image: radial-gradient(color-mix(in oklab, var(--accent) 50%, transparent) 1.6px, transparent 1.8px);
  background-size: 11px 11px;
}

/* Редкий: цветной кант, диагональные полосы */
.rarity-rare {
  --glow: 18px;
  --glow-alpha: 45%;
}
.rarity-rare .face {
  --edge: color-mix(in oklab, var(--accent) 78%, white);
}
.rarity-rare .texture {
  background: repeating-linear-gradient(
    135deg,
    color-mix(in oklab, var(--accent) 34%, transparent) 0 7px,
    transparent 7px 16px
  );
}

/* Эпический: переливающийся кант, ромбовая решётка, блик */
.rarity-epic {
  --glow: 28px;
  --glow-alpha: 62%;
}
.rarity-epic .face {
  border-color: transparent;
  background:
    linear-gradient(180deg, color-mix(in oklab, var(--accent) 24%, var(--sticker-body)), var(--sticker-body) 70%)
      padding-box,
    conic-gradient(from var(--roulette-angle), #ecd2ff, #a255f0, #5f3fc4, #c47bff, #ff9be6, #a255f0, #ecd2ff)
      border-box;
  animation: spin-angle 5s linear infinite;
}
.rarity-epic .texture {
  background:
    repeating-linear-gradient(45deg, color-mix(in oklab, var(--accent) 38%, transparent) 0 1.5px, transparent 1.5px 15px),
    repeating-linear-gradient(-45deg, color-mix(in oklab, var(--accent) 38%, transparent) 0 1.5px, transparent 1.5px 15px);
}
.rarity-epic .foil,
.rarity-legendary .foil,
.rarity-jackpot .foil {
  display: block;
}

/* Легендарный: золотой кант, вращающиеся лучи */
.rarity-legendary {
  --glow: 36px;
  --glow-alpha: 72%;
}
.rarity-legendary .face {
  border-width: 4px;
  border-color: transparent;
  background:
    linear-gradient(180deg, color-mix(in oklab, var(--accent) 30%, var(--sticker-body)), var(--sticker-body) 72%)
      padding-box,
    conic-gradient(from var(--roulette-angle), #fff3c4, #ffb52e, #b8681a, #ffd66b, #fffbe6, #e8901f, #fff3c4)
      border-box;
  animation: spin-angle 3.6s linear infinite;
}
/* Лучи вращаются трансформацией: это дешевле, чем перерисовывать градиент каждый кадр */
.rays {
  inset: -30%;
  background: repeating-conic-gradient(
    color-mix(in oklab, var(--accent) 52%, transparent) 0deg 9deg,
    transparent 9deg 22.5deg
  );
  mask-image: radial-gradient(circle, black 18%, transparent 68%);
  animation: turn 14s linear infinite;
}
.rarity-legendary .ribbon {
  background: linear-gradient(90deg, #ffb52e, #ffe08a 50%, #ffb52e);
}

/* Джекпот: радужная голография, двойные лучи, самое сильное свечение */
.rarity-jackpot {
  --glow: 46px;
  --glow-alpha: 85%;
}
.rarity-jackpot .face {
  border-width: 5px;
  border-color: transparent;
  background:
    linear-gradient(180deg, #5a2748, var(--sticker-body) 74%) padding-box,
    conic-gradient(from var(--roulette-angle), #ff5f98, #ffb52e, #fff3a6, #6ff0c8, #6aa8ff, #c47bff, #ff5f98)
      border-box;
  animation: spin-angle 2.4s linear infinite;
}
.rarity-jackpot .window {
  background: #3a1c38;
}
.rarity-jackpot .texture {
  background: conic-gradient(
    from 210deg at 50% 54%,
    rgba(255, 95, 152, 0.55),
    rgba(255, 181, 46, 0.45),
    rgba(111, 240, 200, 0.4),
    rgba(106, 168, 255, 0.45),
    rgba(196, 123, 255, 0.5),
    rgba(255, 95, 152, 0.55)
  );
}
.rarity-jackpot .rays {
  background: repeating-conic-gradient(rgba(255, 244, 214, 0.55) 0deg 7deg, transparent 7deg 18deg);
  animation-duration: 8s;
}
.rarity-jackpot .value {
  background: linear-gradient(90deg, #ffd0e0, #ffe08a, #b8ffe6, #c8dcff, #ffd0e0);
  background-size: 200% 100%;
  background-clip: text;
  color: transparent;
  text-shadow: none;
  animation: holo 2.4s linear infinite;
}
.rarity-jackpot .ribbon {
  background: linear-gradient(90deg, #ff5f98, #ffb52e, #fff3a6, #6ff0c8, #6aa8ff, #c47bff, #ff5f98);
  background-size: 200% 100%;
  animation: holo 2.4s linear infinite;
}
.rarity-jackpot .foil {
  animation-duration: 1.8s;
}

/* --- После остановки ------------------------------------------------------------------- */
.is-dim {
  opacity: 0.42;
  filter: saturate(0.45);
  transform: scale(0.93);
}

.is-win {
  z-index: 2;
  --glow: 48px;
  --glow-alpha: 90%;
  transform: scale(1.16);
}
.is-win .face {
  box-shadow:
    0 16px 32px rgba(0, 0, 0, 0.5),
    0 0 var(--glow) color-mix(in oklab, var(--accent) var(--glow-alpha), transparent),
    0 0 calc(var(--glow) * 2) color-mix(in oklab, var(--accent) 45%, transparent);
}
.is-win .art {
  animation: art-pop 900ms cubic-bezier(0.34, 1.56, 0.64, 1) both;
}
.is-win .value {
  animation: value-pop 600ms 120ms cubic-bezier(0.34, 1.56, 0.64, 1) both;
}
.is-win.rarity-jackpot .value {
  animation:
    value-pop 600ms 120ms cubic-bezier(0.34, 1.56, 0.64, 1) both,
    holo 2.4s linear infinite;
}

/* Пусто: карточка грустно вздрагивает и гаснет, вместо искр — пыль */
.is-win.rarity-empty {
  --glow: 0px;
  transform: scale(1.04);
  animation: sad-shake 620ms ease-in-out;
}
.is-win.rarity-empty .art {
  animation: sad-drop 900ms ease-out both;
}

.flash {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(circle at 50% 40%, #ffffff, color-mix(in oklab, var(--accent) 60%, transparent) 60%, transparent);
  animation: flash 620ms ease-out both;
}
.rarity-empty .flash {
  display: none;
}

.ring {
  position: absolute;
  inset: 0;
  border: 3px solid var(--accent);
  border-radius: 20px;
  pointer-events: none;
  animation: ring 900ms cubic-bezier(0.16, 1, 0.3, 1) both;
}
.ring-late {
  animation-delay: 220ms;
}
.rarity-empty .ring,
.rarity-common .ring-late {
  display: none;
}

.burst {
  position: absolute;
  top: 40%;
  left: 50%;
  z-index: 3;
  pointer-events: none;
}
.burst i {
  position: absolute;
  width: var(--size);
  height: var(--size);
  background: var(--accent);
  clip-path: polygon(50% 0, 62% 38%, 100% 50%, 62% 62%, 50% 100%, 38% 62%, 0 50%, 38% 38%);
  translate: -50% -50%;
  animation: particle 1100ms var(--delay) cubic-bezier(0.1, 0.7, 0.3, 1) both;
}
.burst i.alt {
  background: #fff3cf;
}
.rarity-jackpot .burst i:nth-child(4n) {
  background: #6ff0c8;
}
.rarity-jackpot .burst i:nth-child(4n + 2) {
  background: #ffd066;
}

.burst b {
  position: absolute;
  width: 26px;
  height: 26px;
  border-radius: 999px;
  background: rgba(190, 180, 200, 0.55);
  translate: -50% -50%;
  animation: puff 1200ms ease-out both;
}
.puff-1 {
  --dx: -86px;
  --dy: 74px;
}
.puff-2 {
  --dx: -40px;
  --dy: 104px;
  animation-delay: 90ms !important;
}
.puff-3 {
  --dx: 6px;
  --dy: 90px;
  animation-delay: 180ms !important;
}
.puff-4 {
  --dx: 52px;
  --dy: 108px;
  animation-delay: 60ms !important;
}
.puff-5 {
  --dx: 90px;
  --dy: 70px;
  animation-delay: 140ms !important;
}

/* --- Кадры ----------------------------------------------------------------------------- */
@keyframes spin-angle {
  to {
    --roulette-angle: 360deg;
  }
}
@keyframes turn {
  to {
    rotate: 360deg;
  }
}
@keyframes holo {
  to {
    background-position: -200% 0;
  }
}
@keyframes foil {
  0%,
  35% {
    transform: translateX(-45%);
  }
  75%,
  100% {
    transform: translateX(45%);
  }
}
@keyframes twinkle {
  0%,
  100% {
    opacity: 0.1;
    scale: 0.4;
  }
  50% {
    opacity: 1;
    scale: 1.15;
  }
}
@keyframes art-pop {
  0% {
    transform: scale(1);
  }
  35% {
    transform: scale(1.28) translateY(-4px);
  }
  100% {
    transform: scale(1.1);
  }
}
@keyframes value-pop {
  0% {
    transform: scale(1);
  }
  45% {
    transform: scale(1.35);
  }
  100% {
    transform: scale(1.08);
  }
}
@keyframes flash {
  0% {
    opacity: 0;
  }
  18% {
    opacity: 0.9;
  }
  100% {
    opacity: 0;
  }
}
@keyframes ring {
  0% {
    opacity: 1;
    transform: scale(1);
  }
  100% {
    opacity: 0;
    transform: scale(1.6);
  }
}
@keyframes particle {
  0% {
    opacity: 0;
    transform: translate(0, 0) scale(0.4) rotate(0);
  }
  12% {
    opacity: 1;
  }
  70% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translate(var(--dx), calc(var(--dy) + 26px)) scale(1.3) rotate(160deg);
  }
}
@keyframes puff {
  0% {
    opacity: 0;
    transform: translate(0, 40px) scale(0.3);
  }
  25% {
    opacity: 0.8;
  }
  100% {
    opacity: 0;
    transform: translate(var(--dx), var(--dy)) scale(1.5);
  }
}
@keyframes sad-shake {
  0%,
  100% {
    translate: 0;
  }
  20% {
    translate: -7px 0;
  }
  40% {
    translate: 6px 0;
  }
  60% {
    translate: -4px 0;
  }
  80% {
    translate: 2px 0;
  }
}
@keyframes sad-drop {
  from {
    transform: translateY(0);
  }
  to {
    transform: translateY(9px) scale(0.94);
  }
}

@media (prefers-reduced-motion: reduce) {
  .roulette-card,
  .roulette-card * {
    animation: none !important;
    transition: none !important;
  }
  .ring,
  .burst,
  .flash {
    display: none;
  }
}
</style>
