<script setup lang="ts">
// Все ачивки зрителя, и взятые, и ещё нет: значок, уровень и прогресс до следующего.
import {
  ACHIEVEMENT_CATEGORIES,
  achievementArtPath,
  achievementLevel,
  achievementRarity,
  requirementLabel,
  visibleLevels,
  type AchievementCounters,
} from '#shared/achievements';
import { achievementAccent, achievementRarityLabel } from '~/utils/achievements';

const props = defineProps<{ counters: AchievementCounters }>();

const items = computed(() =>
  ACHIEVEMENT_CATEGORIES.map((category) => {
    const value = props.counters[category.counter];
    const level = achievementLevel(category.thresholds, value);
    // Редкость по полной лестнице, а число ступеней - только достижимых сейчас
    const levels = category.thresholds.length;
    const reachable = visibleLevels(category);
    // У невзятой ачивки показываем блёклый значок первой ступени
    const shown = Math.max(level, 1);
    return {
      id: category.id,
      title: category.title,
      unit: category.unit,
      value,
      level,
      levels: reachable,
      next: level < reachable ? (category.thresholds[level] ?? null) : null,
      nextLabel: requirementLabel(category, level + 1),
      squad: Boolean(category.requirements),
      rarity: achievementRarity(shown, levels),
      art: achievementArtPath(category, shown),
    };
  }),
);
const earned = computed(() => items.value.filter((item) => item.level > 0).length);
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex flex-wrap items-center justify-between gap-2">
        <h2 class="text-lg font-semibold text-highlighted">Ачивки</h2>
        <UBadge color="neutral" variant="subtle" size="lg">взято: {{ earned }} из {{ items.length }}</UBadge>
      </div>
    </template>

    <ul class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <li v-for="item in items" :key="item.id" class="flex items-center gap-3 rounded-md border border-default p-3">
        <div class="size-20 shrink-0" :class="item.level === 0 && 'opacity-35 grayscale'">
          <img v-if="item.art" :src="item.art" alt="" class="size-20 object-contain" draggable="false" />
          <AchievementIcon v-else :category="item.id" :rarity="item.rarity" class="size-20" />
        </div>
        <div class="flex min-w-0 flex-1 flex-col gap-1">
          <span class="font-semibold text-highlighted">{{ item.title }}</span>
          <!-- Цвет ступени тот же, что у значка на оверлее -->
          <span
            class="text-sm"
            :class="item.level === 0 && 'text-dimmed'"
            :style="item.level ? { color: achievementAccent(item.rarity) } : undefined"
          >
            {{
              item.level
                ? `Уровень ${item.level} из ${item.levels} · ${achievementRarityLabel(item.rarity)}`
                : 'Ещё не взята'
            }}
          </span>
          <UProgress :model-value="item.next === null ? 1 : item.value" :max="item.next ?? 1" size="sm" />
          <span class="text-xs text-muted tabular-nums">
            {{
              item.next === null
                ? item.squad
                  ? 'Все доступные ступени взяты, новые появятся с новыми героями'
                  : `${formatNumber(item.value)} ${item.unit}, все уровни взяты`
                : item.nextLabel
                  ? `Дальше: ${item.nextLabel}`
                  : `${formatNumber(item.value)} из ${formatNumber(item.next)} ${item.unit}`
            }}
          </span>
        </div>
      </li>
    </ul>
  </UCard>
</template>
