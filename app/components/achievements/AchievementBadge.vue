<script setup lang="ts">
// Один значок ачивки: готовая картинка (стрик, пиво) или SVG-иконка, под ним число и название.
import { achievementArtPath, findCategory } from '#shared/achievements';
import { achievementAccent } from '~/utils/achievements';

const props = defineProps<{
  category: string;
  level: number;
  rarity: number;
  /** Значение счётчика: «×15» */
  value: number;
}>();

const category = computed(() => findCategory(props.category));
const art = computed(() => (category.value ? achievementArtPath(category.value, props.level) : null));
</script>

<template>
  <div v-if="category" class="flex w-24 flex-col items-center gap-1 text-center">
    <img v-if="art" :src="art" :alt="category.title" class="size-24 object-contain" draggable="false" />
    <AchievementIcon v-else :category="category.id" :rarity="rarity" class="size-24" />
    <span class="text-sm leading-none font-extrabold" :style="{ color: achievementAccent(rarity) }">{{ value }}</span>
    <span class="text-[11px] leading-tight font-bold text-sticker-muted">{{ category.title }}</span>
  </div>
</template>
