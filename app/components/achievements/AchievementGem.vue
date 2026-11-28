<script setup lang="ts">
// Значок со своей оправой: башня это арка с кладкой и искрами вверх, босс шестигранник с красным
// пульсом и дымом, уровень щит с бегущими вверх шевронами, отряд вымпел с тремя звёздами по кругу.
// Ступень редкости остаётся той же: цвет и ход канта, свечение, лучи с четвёртой ступени.
import { ACHIEVEMENT_ART } from '~/utils/achievementArt';
import { achievementAccent, type AchievementFrame } from '~/utils/achievements';
import type { ArtShape } from '~/utils/roulette/art';

const props = defineProps<{ category: string; rarity: number; frame: AchievementFrame }>();

const shapes = computed<ArtShape[]>(() => ACHIEVEMENT_ART[props.category] ?? []);
const silhouette = computed(() => shapes.value.filter((shape) => shape.solid !== false));
const strokeOf = (shape: ArtShape): string => shape.stroke ?? (shape.solid === false ? 'none' : '#2b2630');
</script>

<template>
  <div
    class="gem"
    :class="[`frame-${frame}`, `gem-tier-${rarity}`]"
    :style="{ '--accent': achievementAccent(rarity) }"
    aria-hidden="true"
  >
    <span class="halo"><span class="halo-shape" /></span>
    <span class="ring"><span class="spin" /></span>
    <span class="face">
      <span class="rays" />
      <span class="fx" />
      <span class="fx2" />
      <span v-if="frame === 'pennant'" class="orbit"><i /><i /><i /></span>
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
    </span>
  </div>
</template>

<style scoped>
.gem {
  --mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='none'%3E%3Cpath d='M0%20100V34A50%2034%200%200%201%20100%2034V100Z'/%3E%3C/svg%3E");
  --glow: 0px;
  --gap: 4px;
  position: relative;
  aspect-ratio: 1;
}
.frame-arch {
  --mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='none'%3E%3Cpath d='M0%20100V34A50%2034%200%200%201%20100%2034V100Z'/%3E%3C/svg%3E");
}
.frame-hex {
  --mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='none'%3E%3Cpath d='M25%203L75%203L100%2050L75%2097L25%2097L0%2050Z'/%3E%3C/svg%3E");
}
.frame-shield {
  --mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='none'%3E%3Cpath d='M0%206L50%200L100%206L100%2052L84%2078L50%20100L16%2078L0%2052Z'/%3E%3C/svg%3E");
}
.frame-pennant {
  --mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='none'%3E%3Cpath d='M0%200H100V74L50%20100L0%2074Z'/%3E%3C/svg%3E");
}

.halo {
  position: absolute;
  inset: 0;
  opacity: 0.9;
  filter: blur(calc(var(--glow) * 0.7));
}
.halo-shape {
  position: absolute;
  inset: 0;
  mask: var(--mask) center / 100% 100% no-repeat;
  -webkit-mask: var(--mask) center / 100% 100% no-repeat;
  background: color-mix(in oklab, var(--accent) 85%, transparent);
}
.ring,
.face {
  position: absolute;
  mask: var(--mask) center / 100% 100% no-repeat;
  -webkit-mask: var(--mask) center / 100% 100% no-repeat;
}
.ring {
  inset: 0;
  overflow: hidden;
  background: #dccbb2;
}
.face {
  inset: var(--gap);
  overflow: hidden;
  background: radial-gradient(circle at 50% 38%, color-mix(in oklab, var(--accent) 38%, #2b2630), #201c25 78%);
}
.face > svg {
  position: absolute;
  inset: 8%;
  width: 84%;
  height: 84%;
  filter: drop-shadow(0 3px 2px rgba(0, 0, 0, 0.45));
}
.rays,
.fx,
.fx2,
.orbit {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

/* Свой фон у каждой оправы */
.frame-arch .fx {
  opacity: 0.4;
  background:
    repeating-linear-gradient(0deg, color-mix(in oklab, var(--accent) 60%, transparent) 0 1.5px, transparent 1.5px 14px),
    repeating-linear-gradient(90deg, color-mix(in oklab, var(--accent) 60%, transparent) 0 1.5px, transparent 1.5px 22px);
}
.frame-arch .fx2 {
  background-image: radial-gradient(circle, #fff3c4 1.3px, transparent 1.7px);
  background-size: 17px 23px;
  opacity: 0.8;
  animation: rise 3.2s linear infinite;
}
.frame-hex .fx {
  background: radial-gradient(circle at 50% 55%, rgba(255, 70, 90, 0.75), transparent 62%);
  animation: pulse 2s ease-in-out infinite;
}
.frame-hex .fx2 {
  background:
    radial-gradient(circle at 25% 80%, rgba(255, 255, 255, 0.22) 0 18%, transparent 40%),
    radial-gradient(circle at 75% 85%, rgba(255, 255, 255, 0.18) 0 16%, transparent 38%);
  animation: smoke 4s ease-in-out infinite alternate;
}
.frame-shield .fx {
  opacity: 0.45;
  background:
    linear-gradient(135deg, transparent 44%, color-mix(in oklab, var(--accent) 80%, white) 46% 54%, transparent 56%) 0 0 / 28px 28px,
    linear-gradient(225deg, transparent 44%, color-mix(in oklab, var(--accent) 80%, white) 46% 54%, transparent 56%) 0 0 / 28px 28px;
  animation: climb 2.4s linear infinite;
}
.frame-pennant .fx {
  background:
    repeating-linear-gradient(90deg, color-mix(in oklab, var(--accent) 35%, transparent) 0 9px, transparent 9px 18px);
  opacity: 0.55;
  animation: sway 5s ease-in-out infinite alternate;
}
.orbit {
  animation: orbit 7s linear infinite;
}
.orbit i {
  position: absolute;
  width: 9%;
  height: 9%;
  background: #fff6d2;
  clip-path: polygon(50% 0, 62% 38%, 100% 50%, 62% 62%, 50% 100%, 38% 62%, 0 50%, 38% 38%);
}
.orbit i:nth-child(1) {
  top: 7%;
  left: 45%;
}
.orbit i:nth-child(2) {
  top: 62%;
  left: 10%;
}
.orbit i:nth-child(3) {
  top: 62%;
  right: 10%;
}

/* Ступени: кант и свечение */
.gem-tier-2 .ring {
  background: color-mix(in oklab, var(--accent) 78%, white);
}
.gem-tier-2 {
  --glow: 7px;
}
.gem-tier-3 {
  --glow: 11px;
}
.spin {
  position: absolute;
  inset: -50%;
}
.gem-tier-3 .spin {
  background: conic-gradient(#ecd2ff, #a255f0, #5f3fc4, #c47bff, #ff9be6, #a255f0, #ecd2ff);
  animation: turn 5s linear infinite;
}
.gem-tier-4 {
  --glow: 16px;
  --gap: 5px;
}
.gem-tier-4 .spin {
  background: conic-gradient(#fff3c4, #ffb52e, #b8681a, #ffd66b, #fffbe6, #e8901f, #fff3c4);
  animation: turn 3.6s linear infinite;
}
.gem-tier-5 {
  --glow: 22px;
  --gap: 5px;
}
.gem-tier-5 .spin {
  background: conic-gradient(#ff5f98, #ffb52e, #fff3a6, #6ff0c8, #6aa8ff, #c47bff, #ff5f98);
  animation: turn 2.4s linear infinite;
}
.gem-tier-5 .face {
  background: linear-gradient(180deg, #5a2748, #3a1c38);
}
.gem-tier-4 .rays,
.gem-tier-5 .rays {
  inset: -40%;
  mask-image: radial-gradient(circle, black 16%, transparent 66%);
  background: repeating-conic-gradient(color-mix(in oklab, var(--accent) 50%, transparent) 0deg 9deg, transparent 9deg 22.5deg);
  animation: turn 16s linear infinite;
}

.twinkle {
  position: absolute;
  width: 10%;
  height: 10%;
  background: #fff6d2;
  clip-path: polygon(50% 0, 62% 38%, 100% 50%, 62% 62%, 50% 100%, 38% 62%, 0 50%, 38% 38%);
  animation: twinkle 2.2s ease-in-out infinite;
}
.t1 {
  top: 16%;
  left: 14%;
}
.t2 {
  right: 14%;
  bottom: 30%;
  animation-delay: 0.9s;
}

@keyframes turn {
  to {
    transform: rotate(360deg);
  }
}
@keyframes rise {
  to {
    background-position: 0 -23px;
  }
}
@keyframes climb {
  to {
    background-position: 0 -28px;
  }
}
@keyframes pulse {
  0%,
  100% {
    opacity: 0.35;
    transform: scale(0.92);
  }
  50% {
    opacity: 1;
    transform: scale(1.06);
  }
}
@keyframes smoke {
  from {
    transform: translate(-4%, 3%);
  }
  to {
    transform: translate(5%, -6%);
  }
}
@keyframes sway {
  from {
    background-position-x: 0;
  }
  to {
    background-position-x: 18px;
  }
}
@keyframes orbit {
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
  .spin,
  .rays,
  .fx,
  .fx2,
  .orbit,
  .twinkle {
    animation: none;
  }
}
</style>
