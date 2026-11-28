<script setup lang="ts">
import { getBonusById } from '#shared/towerBonus';

const props = defineProps<{ id: string }>();
const bonus = computed(() => getBonusById(props.id));
</script>

<template>
  <div
    v-if="bonus"
    class="flex items-center gap-2"
  >
    <TowerBonusIcon
      :id="bonus.id"
      class="size-5 shrink-0 text-sticker-mint"
    />
    <span class="text-[13px] font-extrabold uppercase">{{ bonus.title }}</span>
    <span class="text-[13px] font-semibold text-sticker-muted">{{ bonus.description }}</span>
  </div>
</template>
