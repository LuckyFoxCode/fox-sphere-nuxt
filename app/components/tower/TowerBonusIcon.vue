<script setup lang="ts">
import type { TowerBonus } from '#shared/towerBonus';

defineProps<{ id: TowerBonus['id'] }>();
</script>

<template>
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <!-- меч -->
    <g v-if="id === 'fury'">
      <path d="M14.5 4.5 20 4l-.5 5.5L9 20l-5-5Z" />
      <path d="m7 13 4 4M4 20l3-3" />
    </g>
    <!-- щит -->
    <path
      v-else-if="id === 'armor'"
      d="M12 3 5 6v5c0 5 3 8 7 10 4-2 7-5 7-10V6Z"
    />
    <!-- сердце -->
    <path
      v-else-if="id === 'vigor'"
      d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.600-7 10-7 10Z"
    />
    <!-- череп -->
    <g v-else-if="id === 'weak-foes'">
      <path d="M5 11a7 7 0 0 1 14 0c0 2-1 3-2 3.500V18H7v-3.500C6 14 5 13 5 11Z" />
      <path d="M9.500 11h.01M14.500 11h.01M10 18v-2M14 18v-2" />
    </g>
    <!-- трещина -->
    <g v-else-if="id === 'brittle-foes'">
      <path d="M4 4h16v16H4Z" />
      <path d="m12 4-2 5 4 3-3 3 2 5" />
    </g>
    <!-- молния -->
    <path
      v-else
      d="M13 3 5 13h6l-1 8 8-10h-6Z"
    />
  </svg>
</template>
