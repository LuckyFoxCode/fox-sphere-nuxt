<script setup lang="ts">
// Значок ачивки: круглая коллекционная наклейка в духе карточек рулетки. Картинка та же вырубная
// наклейка с овсяным кантом, а ступень читается по фону и канту: горошек, полосы, решётка,
// золотые лучи, радужная голография.
import { ACHIEVEMENT_ART } from '~/utils/achievementArt';
import { achievementAccent } from '~/utils/achievements';
import type { ArtShape } from '~/utils/roulette/art';

const props = defineProps<{
  /** spins | prize500 | prize1000 | jackpot */
  category: string;
  /** 1..5 */
  rarity: number;
}>();

const shapes = computed<ArtShape[]>(() => ACHIEVEMENT_ART[props.category] ?? []);
const silhouette = computed(() => shapes.value.filter((shape) => shape.solid !== false));
const strokeOf = (shape: ArtShape): string => shape.stroke ?? (shape.solid === false ? 'none' : '#2b2630');
</script>

<template>
  <div class="medal" :class="`tier-${rarity}`" :style="{ '--accent': achievementAccent(rarity) }" aria-hidden="true">
    <span class="rays" />
    <span class="texture" />
    <svg viewBox="-6 -6 112 112" stroke-linecap="round" stroke-linejoin="round">
      <g fill="#f4e8d4" stroke="#f4e8d4" stroke-width="9">
        <path v-for="(shape, index) in silhouette" :key="index" :d="shape.d" />
      </g>
      <path
        v-for="(shape, index) in shapes"
        :key="index"
        :d="shape.d"
        :fill="shape.fill ?? 'none'"
        :stroke="strokeOf(shape)"
        :stroke-width="shape.width ?? 2.5"
        :stroke-dasharray="shape.dash"
      />
    </svg>
    <i v-if="rarity >= 3" class="twinkle t1" />
    <i v-if="rarity >= 4" class="twinkle t2" />
    <i v-if="rarity >= 5" class="twinkle t3" />
  </div>
</template>

<style scoped>
@property --ach-angle {
  syntax: '<angle>';
  inherits: false;
  initial-value: 0deg;
}

.medal {
  --edge: #dccbb2;
  --glow: 0px;
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
  border: 4px solid var(--edge);
  border-radius: 9999px;
  background: radial-gradient(circle at 50% 38%, color-mix(in oklab, var(--accent) 38%, #2b2630), #201c25 78%);
  box-shadow: 0 0 var(--glow) color-mix(in oklab, var(--accent) 75%, transparent);
}
.medal > svg {
  position: absolute;
  inset: 7%;
  width: 86%;
  height: 86%;
  filter: drop-shadow(0 3px 2px rgba(0, 0, 0, 0.45));
}
.texture,
.rays {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.rays {
  display: none;
  inset: -40%;
  mask-image: radial-gradient(circle, black 16%, transparent 66%);
  animation: turn 16s linear infinite;
}

/* 1 · common: овсяный кант, горошек */
.tier-1 .texture {
  background-image: radial-gradient(color-mix(in oklab, var(--accent) 55%, transparent) 1.4px, transparent 1.6px);
  background-size: 9px 9px;
}

/* 2 · rare: цветной кант, диагональные полосы */
.tier-2 {
  --edge: color-mix(in oklab, var(--accent) 78%, white);
  --glow: 10px;
}
.tier-2 .texture {
  background: repeating-linear-gradient(135deg, color-mix(in oklab, var(--accent) 38%, transparent) 0 6px, transparent 6px 13px);
}

/* 3 · epic: фиолетовый переливающийся кант, ромбовая решётка */
.tier-3 {
  --glow: 16px;
  border-color: transparent;
  background:
    radial-gradient(circle at 50% 38%, color-mix(in oklab, var(--accent) 40%, #2b2630), #201c25 78%) padding-box,
    conic-gradient(from var(--ach-angle), #ecd2ff, #a255f0, #5f3fc4, #c47bff, #ff9be6, #a255f0, #ecd2ff) border-box;
  animation: spin-angle 5s linear infinite;
}
.tier-3 .texture {
  background:
    repeating-linear-gradient(45deg, color-mix(in oklab, var(--accent) 40%, transparent) 0 1.5px, transparent 1.5px 11px),
    repeating-linear-gradient(-45deg, color-mix(in oklab, var(--accent) 40%, transparent) 0 1.5px, transparent 1.5px 11px);
}

/* 4 · legendary: золотой кант, вращающиеся лучи */
.tier-4 {
  --glow: 24px;
  border-width: 5px;
  border-color: transparent;
  background:
    radial-gradient(circle at 50% 38%, color-mix(in oklab, var(--accent) 46%, #2b2630), #2b2630 80%) padding-box,
    conic-gradient(from var(--ach-angle), #fff3c4, #ffb52e, #b8681a, #ffd66b, #fffbe6, #e8901f, #fff3c4) border-box;
  animation: spin-angle 3.6s linear infinite;
}
.tier-4 .rays {
  display: block;
  background: repeating-conic-gradient(color-mix(in oklab, var(--accent) 55%, transparent) 0deg 9deg, transparent 9deg 22.5deg);
}

/* 5 · jackpot: радужная голография, двойные лучи, самое сильное свечение */
.tier-5 {
  --glow: 34px;
  border-width: 5px;
  border-color: transparent;
  background:
    linear-gradient(180deg, #5a2748, #3a1c38) padding-box,
    conic-gradient(from var(--ach-angle), #ff5f98, #ffb52e, #fff3a6, #6ff0c8, #6aa8ff, #c47bff, #ff5f98) border-box;
  animation: spin-angle 2.4s linear infinite;
}
.tier-5 .rays {
  display: block;
  background: repeating-conic-gradient(rgba(255, 244, 214, 0.55) 0deg 7deg, transparent 7deg 18deg);
  animation-duration: 9s;
}
.tier-5 .texture {
  background: conic-gradient(
    from 210deg at 50% 54%,
    rgba(255, 95, 152, 0.5),
    rgba(255, 181, 46, 0.4),
    rgba(111, 240, 200, 0.38),
    rgba(106, 168, 255, 0.42),
    rgba(196, 123, 255, 0.46),
    rgba(255, 95, 152, 0.5)
  );
}

.twinkle {
  position: absolute;
  width: 11%;
  height: 11%;
  background: #fff6d2;
  clip-path: polygon(50% 0, 62% 38%, 100% 50%, 62% 62%, 50% 100%, 38% 62%, 0 50%, 38% 38%);
  animation: twinkle 2.2s ease-in-out infinite;
}
.t1 {
  top: 14%;
  left: 14%;
}
.t2 {
  right: 12%;
  bottom: 22%;
  animation-delay: 0.7s;
}
.t3 {
  top: 24%;
  right: 16%;
  animation-delay: 1.4s;
}

@keyframes spin-angle {
  to {
    --ach-angle: 360deg;
  }
}
@keyframes turn {
  to {
    transform: rotate(360deg);
  }
}
@keyframes twinkle {
  0%,
  100% {
    opacity: 0;
    transform: scale(0.4);
  }
  50% {
    opacity: 1;
    transform: scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .medal,
  .rays,
  .twinkle {
    animation: none;
  }
}
</style>
