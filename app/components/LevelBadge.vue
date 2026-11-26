<script setup lang="ts">
// Кольцо ранга с цифрой уровня внутри, перенесено из старого fox-sphere. Кольцо выбирается
// по тиру ранга (utils/chat/ranks.ts); голое, без рамки.
import { getRankConfigByLevel, MAX_ICON_TIER, RANK_RINGS } from '~/utils/chat/ranks';

const props = withDefaults(defineProps<{ level: number; size?: number; isBroadcaster?: boolean }>(), {
  size: 64,
  isBroadcaster: false,
});

const ring = computed(
  () => RANK_RINGS[Math.min(getRankConfigByLevel(props.level, props.isBroadcaster).tier, MAX_ICON_TIER)],
);

const ringStyle = computed(() => ({ width: `${props.size}px`, height: `${props.size}px` }));
const levelStyle = computed(() => ({ fontSize: `${Math.round(props.size * 0.28)}px` }));
</script>

<template>
  <div class="relative flex shrink-0 text-text-main">
    <component :is="ring" :style="ringStyle" />
    <span class="absolute top-1/2 left-1/2 -translate-1/2 font-bold tabular-nums" :style="levelStyle">
      {{ level }}
    </span>
  </div>
</template>
