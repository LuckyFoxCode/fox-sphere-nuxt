<script setup lang="ts">
import type { HeroDefinition, HeroStats } from '#shared/heroes';
import type { Component } from 'vue';
import IconBoot from '~/components/icons/IconBoot.vue';
import IconHeartPlus from '~/components/icons/IconHeartPlus.vue';
import IconShield from '~/components/icons/IconShield.vue';
import IconSword from '~/components/icons/IconSword.vue';
import { buildPortraitStyle } from '~/utils/heroPortrait';

const props = defineProps<{
  hero: HeroDefinition;
  stats: HeroStats;
  maxStats: HeroStats;
  state: 'equipped' | 'owned' | 'free' | 'affordable' | 'locked';
  shortfall: number;
  prefix: string;
}>();

// Иконки и подписи те же, что в профиле; цвета на два шейда светлее для тёмного фона
const STAT_ROWS = [
  { key: 'health', label: 'HP', icon: IconHeartPlus, iconClass: 'size-7 text-rose-300', bar: 'bg-rose-300' },
  { key: 'attack', label: 'ATK', icon: IconSword, iconClass: 'size-7 text-orange-300', bar: 'bg-orange-300' },
  { key: 'defense', label: 'DEF', icon: IconShield, iconClass: 'size-8 text-sky-300', bar: 'bg-sky-300' },
  { key: 'speed', label: 'SPD', icon: IconBoot, iconClass: 'size-7 text-emerald-300', bar: 'bg-emerald-300' },
] as const satisfies readonly {
  key: keyof HeroStats;
  label: string;
  icon: Component;
  iconClass: string;
  bar: string;
}[];

const BAR_CELLS = 8;

const rows = computed(() =>
  STAT_ROWS.map((row) => {
    const share = props.maxStats[row.key] > 0 ? props.stats[row.key] / props.maxStats[row.key] : 0;
    return {
      ...row,
      value: `${Math.round(props.stats[row.key] * 10) / 10}`,
      filled: Math.max(1, Math.round(share * BAR_CELLS)),
    };
  }),
);

const portraitStyle = computed(() => buildPortraitStyle(props.hero));
const dimmed = computed(() => props.state === 'locked');
const price = computed(() => props.hero.price.toLocaleString('en-US'));
const command = computed(() =>
  props.state === 'owned' ? `${props.prefix}use hero ${props.hero.id}` : `${props.prefix}buy hero ${props.hero.id}`,
);
</script>

<template>
  <div
    class="bg-sticker-well flex w-60 flex-col items-center gap-y-3 rounded-2xl border-2 px-4 pt-4 pb-4"
    :class="[
      state === 'equipped' ? 'border-sticker-mint' : 'border-sticker-edge/30',
      dimmed ? 'opacity-80' : '',
    ]"
    :data-hero="hero.id"
    :data-state="state"
  >
    <div
      class="bg-sticker-track border-sticker-edge size-36 shrink-0 overflow-hidden rounded-full border-2"
      :style="portraitStyle"
      role="img"
      :aria-label="hero.name"
    />

    <span class="text-3xl leading-none font-extrabold">{{ hero.name }}</span>

    <div class="flex w-full flex-col gap-y-2">
      <div
        v-for="row in rows"
        :key="row.key"
        :data-stat="row.key"
        class="flex items-center gap-x-2"
      >
        <component
          :is="row.icon"
          aria-hidden="true"
          class="shrink-0"
          :class="row.iconClass"
        />
        <span class="text-sticker-muted w-11 shrink-0 text-base font-bold tracking-wider">{{ row.label }}</span>
        <span class="w-10 shrink-0 text-right text-xl leading-none font-extrabold tabular-nums">{{ row.value }}</span>
        <span
          class="flex h-2.5 min-w-0 flex-1 items-center gap-0.5"
          aria-hidden="true"
        >
          <span
            v-for="cell in BAR_CELLS"
            :key="cell"
            class="h-full flex-1 rounded-xs"
            :class="cell <= row.filled ? row.bar : 'bg-sticker-track'"
          />
        </span>
      </div>
    </div>

    <div class="mt-1 flex w-full flex-col items-center gap-y-1.5">
      <div
        v-if="state === 'equipped'"
        class="bg-sticker-mint text-sticker-body w-full rounded-xl py-2 text-center text-xl font-extrabold tracking-wide uppercase"
      >
        Equipped
      </div>
      <div
        v-else-if="state === 'owned'"
        class="border-sticker-mint text-sticker-mint w-full rounded-xl border-2 py-1.5 text-center text-xl font-extrabold tracking-wide uppercase"
      >
        Owned
      </div>
      <div
        v-else-if="state === 'free'"
        class="bg-sticker-edge text-sticker-body w-full rounded-xl py-2 text-center text-xl font-extrabold tracking-wide uppercase"
      >
        Free
      </div>
      <div
        v-else
        class="flex w-full items-center justify-center gap-x-2 rounded-xl py-1.5"
        :class="state === 'affordable' ? 'bg-amber-300 text-stone-900' : 'border-sticker-rose text-sticker-rose border-2'"
      >
        <IconCoin
          aria-hidden="true"
          class="size-8"
          :class="state === 'affordable' ? 'text-stone-900/80' : 'text-sticker-rose'"
        />
        <span class="text-3xl leading-none font-extrabold tabular-nums">{{ price }}</span>
      </div>

      <span
        v-if="state === 'locked'"
        class="text-sticker-rose text-base leading-none font-bold"
      >
        need {{ shortfall.toLocaleString('en-US') }} more
      </span>
      <span
        v-else-if="state !== 'equipped' && state !== 'free'"
        class="text-sticker-muted text-base leading-none font-semibold"
      >
        {{ command }}
      </span>
    </div>
  </div>
</template>
