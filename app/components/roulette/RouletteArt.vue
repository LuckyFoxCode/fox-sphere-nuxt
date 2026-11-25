<script setup lang="ts">
// Картинка приза как вырубная наклейка: овсяный кант по силуэту, внутри плоские фигуры с графитовой линией.
import type { RouletteSegmentId } from '#shared/roulette';
import { ROULETTE_ART, type ArtShape } from '~/utils/roulette/art';

const props = defineProps<{ segment: RouletteSegmentId }>();

const shapes = computed(() => ROULETTE_ART[props.segment]);
const silhouette = computed(() => shapes.value.filter((shape) => shape.solid !== false));

const strokeOf = (shape: ArtShape): string => shape.stroke ?? (shape.solid === false ? 'none' : '#2b2630');
</script>

<template>
  <svg viewBox="-6 -6 112 112" aria-hidden="true" stroke-linecap="round" stroke-linejoin="round">
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
</template>
