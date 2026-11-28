<script setup lang="ts">
// Рождество и Новый год: гирлянда по верхней кромке и снег у боковых краёв кадра. Всё SVG, без картинок.
// Украшения полупрозрачные, без свечения (правило Matte), анимация медленная, чтобы не отвлекать от стрима.
// Центр кадра свободен: снег падает только в боковых полосах, гирлянда занимает верхние ~60 px и рисуется
// под виджетами (в сцене слой стоит первым). Слой не ловит клики: pointer-events отключены.
import type { SeasonIntensity } from '#shared/seasons';

const props = defineProps<{ intensity: SeasonIntensity }>();
const full = computed(() => props.intensity === 'full');

// Матовые цвета из токенов наклеек: розовый, мятный, бумажные янтарный и голубой
const COLORS = ['#e08aa4', '#8fc9b8', '#f2dfba', '#d8e3f7'];
const WIRE = '#6b6075';

const WIDTH = 1920;
const SEGMENT = 240;
const TOP = 6; // где провод крепится к кромке
const SAG = 26; // на сколько провисает середина дуги

type Bulb = { x: number; y: number; color: string; delay: number };
type Ornament = { x: number; y: number; color: string };

// Дуга провода — квадратичная кривая Безье; середина провисает ровно на SAG
const wirePath = Array.from({ length: WIDTH / SEGMENT }, (_, i) => {
  const x = i * SEGMENT;
  return `${i === 0 ? 'M' : ''}${i === 0 ? `${x} ${TOP}` : ''} Q ${x + SEGMENT / 2} ${TOP + 2 * SAG} ${x + SEGMENT} ${TOP}`;
}).join(' ');

const pointOnSegment = (segment: number, t: number) => ({
  x: segment * SEGMENT + t * SEGMENT,
  // y(t) для Безье с концами на TOP и управляющей точкой TOP + 2·SAG
  y: TOP + 2 * SAG * 2 * t * (1 - t),
});

const bulbs = computed<Bulb[]>(() => {
  const perSegment = full.value ? 6 : 4;
  const list: Bulb[] = [];
  for (let segment = 0; segment < WIDTH / SEGMENT; segment++) {
    for (let i = 1; i <= perSegment; i++) {
      const point = pointOnSegment(segment, i / (perSegment + 1));
      const index = segment * perSegment + i;
      list.push({ ...point, color: COLORS[index % COLORS.length]!, delay: -((index * 1.7) % 9) });
    }
  }
  return list;
});

// Шары на нитях: только в «полной» теме, по одному на каждую вторую дугу, в середине (лампочки сюда не попадают)
const ornaments = computed<Ornament[]>(() =>
  full.value
    ? Array.from({ length: WIDTH / SEGMENT }, (_, segment) => segment)
        .filter((segment) => segment % 2 === 1)
        .map((segment) => ({ ...pointOnSegment(segment, 0.5), color: COLORS[segment % 2]! }))
    : [],
);

// Снег: детерминированный набор (без Math.random), чтобы сцена выглядела одинаково при каждой перезагрузке OBS
type Flake = { side: 'left' | 'right'; offset: number; size: number; duration: number; delay: number; sway: number; opacity: number };
const STRIP = 150; // ширина боковой полосы, px

const flakes = computed<Flake[]>(() => {
  const perSide = full.value ? 12 : 6;
  let seed = 7;
  const next = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  const list: Flake[] = [];
  for (const side of ['left', 'right'] as const) {
    for (let i = 0; i < perSide; i++) {
      list.push({
        side,
        offset: Math.round(next() * (STRIP - 24)),
        size: Math.round(10 + next() * 12),
        duration: Math.round(26 + next() * 22),
        delay: -Math.round(next() * 48),
        sway: Math.round(8 + next() * 12),
        opacity: Math.round((0.55 + next() * 0.45) * 100) / 100,
      });
    }
  }
  return list;
});
</script>

<template>
  <div class="christmas pointer-events-none absolute inset-0 overflow-hidden" :class="full ? 'is-full' : 'is-light'" aria-hidden="true">
    <svg class="absolute top-0 left-0 w-full" :viewBox="`0 0 ${WIDTH} 64`" preserveAspectRatio="xMidYMin meet">
      <path :d="wirePath" fill="none" :stroke="WIRE" stroke-width="2" stroke-linecap="round" />
      <g v-for="(ornament, index) in ornaments" :key="`o${index}`">
        <line :x1="ornament.x" :y1="ornament.y" :x2="ornament.x" :y2="ornament.y + 12" :stroke="WIRE" stroke-width="1.5" />
        <rect :x="ornament.x - 3" :y="ornament.y + 10" width="6" height="4" rx="1" :fill="WIRE" />
        <circle :cx="ornament.x" :cy="ornament.y + 23" r="9" :fill="ornament.color" />
        <ellipse :cx="ornament.x - 3" :cy="ornament.y + 19.5" rx="2.5" ry="1.8" fill="#fafafa" fill-opacity="0.35" />
      </g>
      <g
        v-for="(bulb, index) in bulbs"
        :key="`b${index}`"
        class="bulb"
        :style="{ animationDelay: `${bulb.delay}s` }"
      >
        <rect :x="bulb.x - 2.5" :y="bulb.y - 1" width="5" height="6" rx="1" :fill="WIRE" />
        <ellipse :cx="bulb.x" :cy="bulb.y + 12" rx="5.5" ry="7.5" :fill="bulb.color" />
        <ellipse :cx="bulb.x - 1.8" :cy="bulb.y + 9.5" rx="1.6" ry="2.4" fill="#fafafa" fill-opacity="0.3" />
      </g>
    </svg>

    <div
      v-for="(flake, index) in flakes"
      :key="`f${index}`"
      class="flake absolute top-0"
      :style="{
        [flake.side]: `${flake.offset}px`,
        width: `${flake.size}px`,
        height: `${flake.size}px`,
        opacity: flake.opacity,
        animationDuration: `${flake.duration}s`,
        animationDelay: `${flake.delay}s`,
        '--sway': `${flake.sway}px`,
      }"
    >
      <svg viewBox="-10 -10 20 20" class="flake-art h-full w-full" :style="{ animationDuration: `${flake.duration / 3}s`, animationDelay: `${flake.delay}s` }">
        <g stroke="#f2ecf6" stroke-width="1.8" stroke-linecap="round" fill="none">
          <g v-for="angle in [0, 60, 120]" :key="angle" :transform="`rotate(${angle})`">
            <line x1="0" y1="-9" x2="0" y2="9" />
            <polyline points="-2.5,-6.5 0,-4.5 2.5,-6.5" />
            <polyline points="-2.5,6.5 0,4.5 2.5,6.5" />
          </g>
        </g>
      </svg>
    </div>
  </div>
</template>

<style scoped>
.christmas.is-light {
  opacity: 0.55;
}
.christmas.is-full {
  opacity: 0.8;
}

/* Лампочки чуть мерцают: от 70 до 100 % яркости раз в 9 секунд, у каждой своя фаза */
.bulb {
  animation: bulb-twinkle 9s ease-in-out infinite;
}
@keyframes bulb-twinkle {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

/* Снежинка плывёт сверху вниз по краю; боковое покачивание и медленный поворот — на вложенных слоях */
.flake {
  transform: translateY(-40px);
  animation: snow-fall linear infinite;
}
@keyframes snow-fall {
  from {
    transform: translateY(-40px);
  }
  to {
    transform: translateY(1120px);
  }
}
.flake-art {
  animation: snow-sway ease-in-out infinite alternate;
}
@keyframes snow-sway {
  from {
    transform: translateX(calc(var(--sway) * -1)) rotate(-25deg);
  }
  to {
    transform: translateX(var(--sway)) rotate(25deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .bulb,
  .flake,
  .flake-art {
    animation: none;
  }
}
</style>
