<script setup lang="ts">
// Сундук, который трясётся и открывается. Овсяный кант идёт отдельным проходом под фигурами, как в
// RouletteArt; кадры анимации начинаются при появлении, поэтому компонент живёт один показ алерта.
import { CHEST_BODY, CHEST_HEAP, CHEST_LID_CLOSED, CHEST_LID_OPEN } from '~/utils/chestArt';
import type { ArtShape } from '~/utils/roulette/art';

const edge = (shapes: ArtShape[]) => shapes.filter((shape) => shape.solid !== false);
const strokeOf = (shape: ArtShape): string => shape.stroke ?? (shape.solid === false ? 'none' : '#2b2630');

// Порядок слоёв снизу вверх
const LAYERS: { key: string; part: string; shapes: ArtShape[]; isEdge: boolean }[] = [
  { key: 'open-edge', part: 'lid-open', shapes: edge(CHEST_LID_OPEN), isEdge: true },
  { key: 'body-edge', part: 'body', shapes: edge(CHEST_BODY), isEdge: true },
  { key: 'open', part: 'lid-open', shapes: CHEST_LID_OPEN, isEdge: false },
  { key: 'heap', part: 'heap', shapes: CHEST_HEAP, isEdge: false },
  { key: 'body', part: 'body', shapes: CHEST_BODY, isEdge: false },
  { key: 'closed-edge', part: 'lid-closed', shapes: edge(CHEST_LID_CLOSED), isEdge: true },
  { key: 'closed', part: 'lid-closed', shapes: CHEST_LID_CLOSED, isEdge: false },
];
</script>

<template>
  <svg viewBox="-12 -4 224 164" aria-hidden="true" stroke-linecap="round" stroke-linejoin="round">
    <g v-for="layer in LAYERS" :key="layer.key" :class="layer.part">
      <path
        v-for="(shape, index) in layer.shapes"
        :key="index"
        :d="shape.d"
        :fill="layer.isEdge ? '#f4e8d4' : (shape.fill ?? 'none')"
        :stroke="layer.isEdge ? '#f4e8d4' : strokeOf(shape)"
        :stroke-width="layer.isEdge ? 10 : (shape.width ?? 2.5)"
      />
    </g>
  </svg>
</template>

<style scoped>
/* Обычное состояние элементов — открытый сундук: с него же начинают при prefers-reduced-motion */
.lid-open,
.lid-closed,
.heap {
  transform-box: view-box;
  /* Петли */
  transform-origin: 100px 77px;
}
.lid-closed {
  opacity: 0;
  animation: lid-leave 140ms 800ms ease-in both;
}
.lid-open {
  animation: lid-swing 460ms 930ms cubic-bezier(0.34, 1.56, 0.64, 1) both;
}
.heap {
  animation: heap-rise 480ms 960ms cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

@keyframes lid-leave {
  0% {
    opacity: 1;
    transform: scaleY(1);
  }
  99% {
    opacity: 1;
    transform: translateY(-4px) scaleY(0.18);
  }
  100% {
    opacity: 0;
  }
}
@keyframes lid-swing {
  0% {
    opacity: 0;
    transform: scaleY(0.12);
  }
  1% {
    opacity: 1;
  }
  100% {
    opacity: 1;
    transform: scaleY(1);
  }
}
@keyframes heap-rise {
  from {
    opacity: 0;
    transform: translateY(18px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .lid-open,
  .lid-closed,
  .heap {
    animation: none;
  }
}
</style>
