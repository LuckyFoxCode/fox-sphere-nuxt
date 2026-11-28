<script setup lang="ts">
// Level up героя (фрукт роста или опыт из башни): компактная карточка, портрет героя главный. Цвета и рамка
// те же, что у LevelUpCard, но без ранга и полосы опыта аккаунта, чтобы два вида повышения не путались.
import { getHeroById, getHeroStats, type HeroStats } from '#shared/heroes';
import type { HeroLevelUpPayload } from '#shared/events';
import type { Component } from 'vue';
import IconBoot from '~/components/icons/IconBoot.vue';
import IconHeartPlus from '~/components/icons/IconHeartPlus.vue';
import IconLevelUp from '~/components/icons/IconLevelUp.vue';
import IconShield from '~/components/icons/IconShield.vue';
import IconSword from '~/components/icons/IconSword.vue';
import { buildHeroPortraitStyle } from '~/utils/heroPortrait';

const props = defineProps<{ payload: HeroLevelUpPayload }>();

const hero = computed(() => getHeroById(props.payload.heroId));
const portraitStyle = computed(() => buildHeroPortraitStyle(props.payload.heroId));

const STAT_LABELS = [
  { key: 'health', label: 'hp', icon: IconHeartPlus, iconClass: 'size-4 text-rose-300' },
  { key: 'attack', label: 'atk', icon: IconSword, iconClass: 'size-4 text-orange-300' },
  { key: 'defense', label: 'def', icon: IconShield, iconClass: 'size-4.5 text-sky-300' },
  { key: 'speed', label: 'spd', icon: IconBoot, iconClass: 'size-4 text-emerald-300' },
] as const satisfies readonly { key: keyof HeroStats; label: string; icon: Component; iconClass: string }[];

// Статы нового уровня, а в скобке прирост: видно, что дал уровень
const stats = computed(() => {
  const now = getHeroStats(props.payload.heroId, props.payload.newLevel);
  const before = getHeroStats(props.payload.heroId, props.payload.fromLevel);
  return STAT_LABELS.map((stat) => {
    const gain = Math.round((now[stat.key] - before[stat.key]) * 10) / 10;
    return { ...stat, value: `${Math.round(now[stat.key] * 10) / 10}`, gain: gain > 0 ? `+${gain}` : '' };
  });
});

const ariaLabel = computed(
  () => `Hero level up — ${props.payload.username} — ${hero.value.name} level ${props.payload.fromLevel} to ${props.payload.newLevel}`,
);
</script>

<template>
  <StickerFrame role="status" :aria-label="ariaLabel" class="w-120 gap-x-4 py-3.5 pr-4 pl-3.5">
    <div class="plate plate-levelup flex size-32 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-paper-cyan text-sticker-body">
      <div role="img" :aria-label="hero.name" class="plate-icon size-28 rounded-full bg-sticker-body/15" :style="portraitStyle" />
    </div>

    <div class="flex min-w-0 flex-1 flex-col gap-y-2">
      <span class="text-[10px] leading-none font-bold tracking-[0.17em] text-sticker-muted uppercase">hero level up</span>

      <div class="flex flex-col gap-y-1">
        <span class="truncate text-2xl leading-tight font-bold">{{ hero.name }}</span>
        <span class="truncate text-sm leading-tight font-medium text-sticker-muted">{{ payload.username }}</span>
      </div>

      <div class="flex items-center gap-x-2.5">
        <span class="text-lg leading-none font-bold text-sticker-muted tabular-nums">{{ payload.fromLevel }}</span>
        <IconLevelUp aria-hidden="true" class="size-5 shrink-0 rotate-90 text-sticker-muted" />
        <span class="text-3xl leading-none font-extrabold text-sticker-mint tabular-nums">{{ payload.newLevel }}</span>
        <span class="text-xs font-bold tracking-[0.12em] text-sticker-muted uppercase">lvl</span>
      </div>

      <div class="grid grid-cols-4 gap-1.5">
        <div v-for="stat in stats" :key="stat.key" class="flex items-center justify-between gap-x-1 rounded-lg bg-sticker-track px-2 py-1.5">
          <component :is="stat.icon" aria-hidden="true" class="shrink-0" :class="stat.iconClass" />
          <div class="flex flex-col gap-y-0.5">
            <span class="text-[9px] leading-none font-bold tracking-[0.17em] text-sticker-muted uppercase">{{ stat.label }}</span>
            <span class="text-sm leading-none font-bold tabular-nums">{{ stat.value }}</span>
            <span v-if="stat.gain" class="text-[9px] leading-none font-bold text-sticker-mint tabular-nums">{{ stat.gain }}</span>
          </div>
        </div>
      </div>
    </div>
  </StickerFrame>
</template>
