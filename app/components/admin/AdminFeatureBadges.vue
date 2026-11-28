<script setup lang="ts">
// Ярлыки функции из shared/features.ts: стадия (Бета / Баланс) и NEW. Стабильная функция без записи ярлыков не имеет.
import { FEATURES, isNewFeature, STAGE_LABELS, type FeatureInfo } from '#shared/features';

const props = defineProps<{ id: string }>();

const version = useAppVersion();
const info = computed((): FeatureInfo | undefined => (FEATURES as Record<string, FeatureInfo>)[props.id]);
const stageLabel = computed(() => (!info.value || info.value.stage === 'stable' ? null : STAGE_LABELS[info.value.stage]));
const isNew = computed(() => (info.value ? isNewFeature(info.value.since, version) : false));
</script>

<template>
  <span v-if="stageLabel || isNew" class="inline-flex shrink-0 items-center gap-1.5 align-middle">
    <UBadge v-if="isNew" color="success" variant="solid" size="sm">NEW</UBadge>
    <UBadge v-if="stageLabel" :color="info?.stage === 'beta' ? 'warning' : 'info'" variant="subtle" size="sm">
      {{ stageLabel }}
    </UBadge>
  </span>
</template>
