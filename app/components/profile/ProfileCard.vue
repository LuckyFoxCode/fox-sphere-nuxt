<script setup lang="ts">
// Карточка профиля из !profile: ник, уровень и место, XP, монеты и четыре самых редких значка.
// Пустые места показываются тёмными кругами: видно, что есть куда расти.
import { ACHIEVEMENT_CATEGORIES, PROFILE_BADGE_SLOTS } from '#shared/achievements';
import type { ProfileShowPayload } from '#shared/events';

const props = defineProps<{ profile: ProfileShowPayload }>();

const TOTAL = ACHIEVEMENT_CATEGORIES.reduce((sum, category) => sum + category.thresholds.length, 0);
const xpPercent = computed(() => Math.min(100, Math.round((props.profile.xp / props.profile.xpToNext) * 100)));
const slots = computed(() =>
  Array.from({ length: PROFILE_BADGE_SLOTS }, (_, index) => props.profile.badges[index] ?? null),
);
</script>

<template>
  <StickerFrame class="w-130 flex-col items-stretch gap-4 p-5">
    <div class="flex items-end justify-between gap-4">
      <div class="min-w-0">
        <div class="truncate text-2xl leading-none font-extrabold">{{ profile.username }}</div>
        <div class="mt-1.5 text-sm font-bold text-sticker-muted">level {{ profile.lvl }} · rank #{{ profile.rank }}</div>
      </div>
      <div class="rounded-full bg-sticker-well px-3 py-1 text-lg font-extrabold text-sticker-mint">
        {{ profile.coins }} <span class="text-xs font-bold text-sticker-muted">coins</span>
      </div>
    </div>

    <div>
      <div class="h-3 overflow-hidden rounded-full bg-sticker-track">
        <div class="h-full rounded-full bg-sticker-rose" :style="{ width: `${xpPercent}%` }" />
      </div>
      <div class="mt-1 text-right text-xs font-bold text-sticker-muted">{{ profile.xp }} / {{ profile.xpToNext }} xp</div>
    </div>

    <div class="rounded-xl bg-sticker-well px-3 py-3">
      <div class="mb-2 flex items-center justify-between text-xs font-extrabold tracking-wider text-sticker-muted uppercase">
        <span>achievements</span>
        <span>{{ profile.earned }} / {{ TOTAL }}</span>
      </div>
      <div class="flex justify-between gap-2">
        <template v-for="(badge, index) in slots" :key="index">
          <AchievementBadge v-if="badge" v-bind="badge" />
          <div v-else class="flex w-24 flex-col items-center gap-1">
            <div class="size-24 p-2">
              <div class="size-full rounded-full border-2 border-dashed border-sticker-track" />
            </div>
          </div>
        </template>
      </div>
    </div>
  </StickerFrame>
</template>
