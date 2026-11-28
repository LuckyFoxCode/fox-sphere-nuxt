<script setup lang="ts">
// Рождество и Новый год: гирлянда по верхней кромке и снег у боковых краёв кадра. Всё SVG, без картинок.
// Лёгкая тема — сдержанная: гирлянда с бегущим мягким свечением огней и немного снега.
// Полная — богаче: огни горят ярче и быстрее, на гирлянде качаются шары, звёзды и капли, на крючках остролист,
// в верхних углах еловые ветки. Снег в обеих темах один и тот же по характеру (в полной его больше).
// Центр кадра свободен: снег падает только в боковых полосах, гирлянда занимает верхние ~90 px и рисуется
// под виджетами (в сцене слой стоит первым). Слой не ловит клики: pointer-events отключены.
import type { SeasonIntensity } from '#shared/seasons';

const props = defineProps<{ intensity: SeasonIntensity }>();
const full = computed(() => props.intensity === 'full');

// Цвета огней: розовый, мятный, тёплый янтарный и голубой, как токены наклеек, но чуть насыщеннее, чтобы «горели»
const COLORS = ['#ec8aa8', '#8fd6c0', '#f6d98a', '#a9c6f5'];
const WIRE = '#6b6075';
const GREEN = '#6fae93';
const BERRY = '#e0607f';

const WIDTH = 1920;
const SEGMENT = 240;
const TOP = 6; // где провод крепится к кромке
const SAG = 26; // на сколько провисает середина дуги
const HEIGHT = 96;

type Bulb = { x: number; y: number; color: string; phase: number };
type Hanging = { kind: 'ball' | 'star' | 'drop'; x: number; y: number; length: number; color: string; delay: number };

// Дуга провода — квадратичная кривая Безье; середина провисает ровно на SAG
const wirePath = Array.from({ length: WIDTH / SEGMENT }, (_, i) => {
  const x = i * SEGMENT;
  return `${i === 0 ? `M${x} ${TOP}` : ''} Q ${x + SEGMENT / 2} ${TOP + 2 * SAG} ${x + SEGMENT} ${TOP}`;
}).join(' ');

const pointOnSegment = (segment: number, t: number) => ({
  x: segment * SEGMENT + t * SEGMENT,
  y: TOP + 2 * SAG * 2 * t * (1 - t),
});

const bulbs = computed<Bulb[]>(() => {
  const perSegment = full.value ? 6 : 4;
  const list: Bulb[] = [];
  for (let segment = 0; segment < WIDTH / SEGMENT; segment++) {
    for (let i = 1; i <= perSegment; i++) {
      const point = pointOnSegment(segment, i / (perSegment + 1));
      const index = segment * perSegment + i;
      // phase 0..2: три группы огней гаснут и разгораются по очереди, получается мягкая бегущая волна
      list.push({ ...point, color: COLORS[index % COLORS.length]!, phase: index % 3 });
    }
  }
  return list;
});

// Подвески — только в полной теме, по одной на каждой дуге, в середине (там лампочек нет)
const KINDS: Hanging['kind'][] = ['ball', 'star', 'drop', 'ball', 'drop', 'star'];
const hangings = computed<Hanging[]>(() =>
  full.value
    ? Array.from({ length: WIDTH / SEGMENT }, (_, segment) => {
        const point = pointOnSegment(segment, 0.5);
        return {
          kind: KINDS[segment % KINDS.length]!,
          ...point,
          length: [12, 22, 16, 28, 14, 24, 18, 26][segment % 8]!,
          color: ['#e0607f', '#f6d98a', '#8fd6c0', '#a9c6f5'][segment % 4]!,
          delay: -((segment * 1.3) % 6),
        };
      })
    : [],
);

// Пятиконечная звезда с центром в (0, 0)
const starPoints = (outer: number, inner: number): string =>
  Array.from({ length: 10 }, (_, i) => {
    const radius = i % 2 === 0 ? outer : inner;
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    return `${(Math.cos(angle) * radius).toFixed(1)},${(Math.sin(angle) * radius).toFixed(1)}`;
  }).join(' ');
const STAR = starPoints(11, 4.6);

// Остролист на крючках гирлянды (кроме краёв кадра): два листа и три ягоды
const hollyX = Array.from({ length: WIDTH / SEGMENT - 1 }, (_, i) => (i + 1) * SEGMENT);

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
    <svg class="garland absolute top-0 left-0 w-full" :viewBox="`0 0 ${WIDTH} ${HEIGHT}`" preserveAspectRatio="xMidYMin meet">
      <!-- Еловые ветки в верхних углах (полная тема) -->
      <template v-if="full">
        <g v-for="side in [1, -1]" :key="side" :transform="side === 1 ? 'translate(0 0)' : `translate(${WIDTH} 0) scale(-1 1)`">
          <path d="M-4 4 Q 60 12 120 34" :stroke="WIRE" stroke-width="3" fill="none" stroke-linecap="round" />
          <g :stroke="GREEN" stroke-width="2.6" stroke-linecap="round" fill="none">
            <path d="M18 7 l-6 16 M18 7 l10 12" />
            <path d="M42 12 l-6 18 M42 12 l12 12" />
            <path d="M66 18 l-6 20 M66 18 l14 12" />
            <path d="M90 26 l-6 20 M90 26 l14 10" />
            <path d="M112 33 l-4 14 M112 33 l10 6" />
          </g>
          <circle cx="30" cy="22" r="3.4" :fill="BERRY" />
          <circle cx="36" cy="26" r="3.4" :fill="BERRY" />
          <circle cx="76" cy="32" r="3.4" :fill="BERRY" />
        </g>
      </template>

      <path :d="wirePath" fill="none" :stroke="WIRE" stroke-width="2" stroke-linecap="round" />

      <!-- Остролист на крючках (полная тема) -->
      <g v-if="full">
        <g v-for="x in hollyX" :key="`h${x}`" :transform="`translate(${x} ${TOP})`">
          <ellipse cx="-7" cy="3" rx="8" ry="3.4" :fill="GREEN" transform="rotate(-28 -7 3)" />
          <ellipse cx="7" cy="3" rx="8" ry="3.4" :fill="GREEN" transform="rotate(28 7 3)" />
          <circle cx="-2" cy="4" r="2.6" :fill="BERRY" />
          <circle cx="2.5" cy="4.5" r="2.6" :fill="BERRY" />
          <circle cx="0" cy="8" r="2.6" :fill="BERRY" />
        </g>
      </g>

      <!-- Подвески качаются на нитях вокруг точки крепления -->
      <g
        v-for="(item, index) in hangings"
        :key="`o${index}`"
        class="swing"
        :style="{ transformOrigin: `${item.x}px ${item.y}px`, animationDelay: `${item.delay}s` }"
      >
        <line :x1="item.x" :y1="item.y" :x2="item.x" :y2="item.y + item.length" :stroke="WIRE" stroke-width="1.5" />
        <g :transform="`translate(${item.x} ${item.y + item.length})`">
          <template v-if="item.kind === 'ball'">
            <rect x="-3" y="-1" width="6" height="5" rx="1" :fill="WIRE" />
            <circle cx="0" cy="12" r="10" :fill="item.color" />
            <path d="M-9 12 Q 0 18 9 12" fill="none" stroke="#fafafa" stroke-opacity="0.45" stroke-width="2" />
            <ellipse cx="-3.5" cy="8" rx="2.8" ry="2" fill="#fafafa" fill-opacity="0.45" />
          </template>
          <template v-else-if="item.kind === 'star'">
            <polygon :points="STAR" transform="translate(0 11)" :fill="item.color" class="star" />
          </template>
          <template v-else>
            <rect x="-3" y="-1" width="6" height="5" rx="1" :fill="WIRE" />
            <path d="M0 4 C 9 12 9 22 0 26 C -9 22 -9 12 0 4 Z" :fill="item.color" />
            <ellipse cx="-3" cy="12" rx="1.8" ry="3" fill="#fafafa" fill-opacity="0.4" />
          </template>
        </g>
      </g>

      <!-- Огни: у каждого мягкий ореол и лампа; три группы загораются по очереди -->
      <g v-for="(bulb, index) in bulbs" :key="`b${index}`" class="bulb" :style="{ '--phase': bulb.phase }">
        <circle class="halo" :cx="bulb.x" :cy="bulb.y + 12" r="15" :fill="bulb.color" />
        <rect :x="bulb.x - 2.5" :y="bulb.y - 1" width="5" height="6" rx="1" :fill="WIRE" />
        <ellipse :cx="bulb.x" :cy="bulb.y + 12" rx="5.5" ry="7.5" :fill="bulb.color" />
        <ellipse :cx="bulb.x - 1.8" :cy="bulb.y + 9.5" rx="1.6" ry="2.4" fill="#fafafa" fill-opacity="0.35" />
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
/* Гирлянда заметнее снега: прозрачность стоит на ней, а не на всём слое, снег остался прежним */
.garland {
  opacity: 0.8;
}
.is-full .garland {
  opacity: 1;
}
.is-light .flake {
  /* прежний вид снега: слой был на 55 % */
  filter: opacity(0.55);
}
.is-full .flake {
  filter: opacity(0.8);
}

/* Огни: три группы по очереди разгораются и гаснут. В лёгкой теме цикл 5 секунд и перепад небольшой,
   в полной 3 секунды, огни гаснут глубже, а ореол виден. */
.bulb {
  --cycle: 5s;
  animation: bulb-glow var(--cycle) ease-in-out infinite;
  animation-delay: calc(var(--cycle) * var(--phase) / -3);
}
.is-full .bulb {
  --cycle: 3s;
}
.halo {
  opacity: 0.12;
}
.is-full .halo {
  opacity: 0.3;
}
@keyframes bulb-glow {
  0%,
  100% {
    opacity: 0.55;
  }
  35%,
  65% {
    opacity: 1;
  }
}
.is-full .bulb {
  animation-name: bulb-glow-full;
}
@keyframes bulb-glow-full {
  0%,
  100% {
    opacity: 0.3;
  }
  40%,
  60% {
    opacity: 1;
  }
}

/* Подвески чуть покачиваются, звёзды мерцают */
.swing {
  animation: swing 6s ease-in-out infinite alternate;
}
@keyframes swing {
  from {
    transform: rotate(-4deg);
  }
  to {
    transform: rotate(4deg);
  }
}
.star {
  animation: star-pulse 4s ease-in-out infinite;
}
@keyframes star-pulse {
  0%,
  100% {
    opacity: 0.75;
  }
  50% {
    opacity: 1;
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
</style>
