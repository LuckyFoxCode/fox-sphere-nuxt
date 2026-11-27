<script setup lang="ts">
// Level up зрителя: широкая игровая карточка в духе мини-профиля, но на графите, как все алерты (DESIGN.md 4.8).
// Слева крупный портрет героя на бумаге, справа ник, герой, переход уровня с ранговым кольцом, полоса XP до
// следующего уровня и четыре стата героя. Цвет на карточке один — бумага под портретом; вход даёт sticker-slap
// из AlertWidget, портрет один раз поднимается на место (без свечения и пульса).
import { getHeroById, getHeroStats, type HeroStats } from '#shared/heroes';
import type { UserLevelUpPayload } from '#shared/events';
import { getLevelRange } from '#shared/xp';
import type { Component } from 'vue';
import IconBoot from '~/components/icons/IconBoot.vue';
import IconHeartPlus from '~/components/icons/IconHeartPlus.vue';
import IconLevelUp from '~/components/icons/IconLevelUp.vue';
import IconShield from '~/components/icons/IconShield.vue';
import IconSword from '~/components/icons/IconSword.vue';
import { getRankConfigByLevel, MAX_ICON_TIER, RANK_BADGES } from '~/utils/chat/ranks';
import { buildHeroPortraitStyle } from '~/utils/heroPortrait';

const props = defineProps<{ payload: UserLevelUpPayload }>();

const hero = computed(() => (props.payload.heroId ? getHeroById(props.payload.heroId) : null));
const portraitStyle = computed(() => (props.payload.heroId ? buildHeroPortraitStyle(props.payload.heroId) : undefined));
const heroLevel = computed(() => props.payload.heroLevel ?? 1);

const rank = computed(() => getRankConfigByLevel(props.payload.newLevel));
const rankBadge = computed(() => RANK_BADGES[Math.min(rank.value.tier, MAX_ICON_TIER)]);
// Новое звание: титул сменился с прошлого уровня. Тег-флаг, как «new tier» у других наклеек
const isNewRank = computed(
  () => getRankConfigByLevel(props.payload.fromLevel).rankTitle !== rank.value.rankTitle,
);

// Полоса — прогресс внутри нового уровня: XP, startXp и maxXp накопительные, как в карточке профиля
const xpProgress = computed(() => {
  const { startXp, maxXp } = getLevelRange(props.payload.newLevel);
  const range = maxXp - startXp;
  if (range <= 0) return 0;
  return Math.min(Math.max(((props.payload.xp - startXp) / range) * 100, 0), 100);
});
const xpFigures = computed(() => {
  const { maxXp } = getLevelRange(props.payload.newLevel);
  return `${props.payload.xp.toLocaleString('en-US')} / ${maxXp.toLocaleString('en-US')} XP`;
});
const filledCells = computed(() => Math.floor((xpProgress.value / 100) * XP_CELLS));
const cellClass = (index: number): string => {
  if (index >= filledCells.value) return 'bg-sticker-track';
  return index === filledCells.value - 1 ? 'bg-sticker-mint' : 'bg-sticker-rose';
};

const STAT_LABELS = [
  { key: 'health', label: 'hp', icon: IconHeartPlus, iconClass: 'size-4 text-rose-300' },
  { key: 'attack', label: 'atk', icon: IconSword, iconClass: 'size-4 text-orange-300' },
  { key: 'defense', label: 'def', icon: IconShield, iconClass: 'size-4.5 text-sky-300' },
  { key: 'speed', label: 'spd', icon: IconBoot, iconClass: 'size-4 text-emerald-300' },
] as const satisfies readonly { key: keyof HeroStats; label: string; icon: Component; iconClass: string }[];

const stats = computed(() => {
  const values = hero.value ? getHeroStats(hero.value.id, heroLevel.value) : null;
  return STAT_LABELS.map((stat) => ({
    ...stat,
    value: values ? `${Math.round(values[stat.key] * 10) / 10}` : '—',
  }));
});

const ariaLabel = computed(
  () => `Level up — ${props.payload.username} — level ${props.payload.fromLevel} to ${props.payload.newLevel}`,
);
</script>

<template>
  <StickerFrame role="status" :aria-label="ariaLabel" class="w-130 gap-x-4 py-3.5 pr-4 pl-3.5">
    <div
      class="plate plate-levelup flex size-36 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-paper-cyan text-sticker-body"
    >
      <div
        v-if="portraitStyle"
        role="img"
        :aria-label="hero?.name"
        class="plate-icon size-32 rounded-full bg-sticker-body/15"
        :style="portraitStyle"
      />
      <IconLevelUp v-else aria-hidden="true" class="plate-icon size-16" />
    </div>

    <div class="flex min-w-0 flex-1 flex-col gap-y-2">
      <div class="flex items-start justify-between gap-x-2">
        <span class="text-[10px] leading-none font-bold tracking-[0.17em] text-sticker-muted uppercase">level up</span>
        <span
          v-if="isNewRank"
          class="-mt-0.5 shrink-0 rounded-md bg-sticker-edge px-1.5 py-0.5 text-[10px] leading-none font-bold tracking-[0.12em] text-sticker-body uppercase"
        >
          new rank
        </span>
      </div>

      <div class="flex flex-col gap-y-1">
        <span class="truncate text-2xl leading-tight font-bold">{{ payload.username }}</span>
        <span class="truncate text-sm leading-tight font-medium text-sticker-muted">
          {{ hero ? `${hero.name} · hero lvl ${heroLevel}` : 'no hero yet' }}
        </span>
      </div>

      <div class="flex items-center gap-x-2.5">
        <span class="text-lg leading-none font-bold text-sticker-muted tabular-nums">{{ payload.fromLevel }}</span>
        <IconLevelUp aria-hidden="true" class="size-5 shrink-0 rotate-90 text-sticker-muted" />
        <LevelBadge :level="payload.newLevel" :size="52" />
        <span class="flex min-w-0 items-center gap-x-1.5 rounded-lg bg-sticker-well px-2 py-1">
          <component :is="rankBadge" class="size-7 shrink-0" />
          <span
            class="truncate bg-clip-text text-sm leading-none font-extrabold tracking-widest text-transparent uppercase"
            :style="{ backgroundImage: rank.gradient }"
          >
            {{ rank.rankTitle }}
          </span>
        </span>
      </div>

      <div class="flex flex-col gap-y-1">
        <div class="flex items-baseline justify-between">
          <span class="text-[10px] leading-none font-bold tracking-[0.17em] text-sticker-muted uppercase">next level</span>
          <span class="text-[11px] leading-none font-bold text-sticker-muted tabular-nums">{{ xpFigures }}</span>
        </div>
        <div class="flex h-2 w-full items-center gap-0.5" role="progressbar" :aria-valuenow="Math.round(xpProgress)" aria-valuemin="0" aria-valuemax="100">
          <span v-for="index in XP_CELLS" :key="index" class="h-full flex-1 rounded-xs" :class="cellClass(index - 1)" />
        </div>
      </div>

      <div v-if="hero" class="grid grid-cols-4 gap-1.5">
        <div
          v-for="stat in stats"
          :key="stat.key"
          class="flex items-center justify-between gap-x-1 rounded-lg bg-sticker-track px-2 py-1.5"
        >
          <component :is="stat.icon" aria-hidden="true" class="shrink-0" :class="stat.iconClass" />
          <div class="flex flex-col gap-y-0.5">
            <span class="text-[9px] leading-none font-bold tracking-[0.17em] text-sticker-muted uppercase">{{ stat.label }}</span>
            <span class="text-sm leading-none font-bold tabular-nums">{{ stat.value }}</span>
          </div>
        </div>
      </div>
    </div>
  </StickerFrame>
</template>
