<script setup lang="ts">
// Карточка из !profile, перенесена из старого fox-sphere. Это бумага, а не графит: карточка — контент про
// одного зрителя, поэтому она берёт анатомию сообщения чата — тёмная полоса роли над светлым телом.
// Цвета роли и титул считаются теми же функциями, что в чате, чтобы карточка не называла роль,
// которой нет у сообщения.
import {
  ACHIEVEMENT_CATEGORIES,
  achievementArtPath,
  findCategory,
  PROFILE_BADGE_SLOTS,
} from '#shared/achievements';
import { getHeroById, getHeroStats, type HeroStats } from '#shared/heroes';
import { heroXpToNext } from '#shared/tower';
import type { ProfileShowPayload } from '#shared/events';
import type { Component } from 'vue';
import { CHAT_ROLE_STYLES, resolveChatRole, type ChatRole } from '~/utils/chat/chatRoles';
import { getRankConfigByLevel, MAX_ICON_TIER, RANK_BADGES } from '~/utils/chat/ranks';
import IconBoot from '~/components/icons/IconBoot.vue';
import IconHeartPlus from '~/components/icons/IconHeartPlus.vue';
import IconShield from '~/components/icons/IconShield.vue';
import IconSword from '~/components/icons/IconSword.vue';
import { buildHeroPortraitStyle } from '~/utils/heroPortrait';

const props = defineProps<{ profile: ProfileShowPayload }>();

/** `earned` считает ачивки, а не ступени: по одной на категорию, где взята хотя бы первая ступень. Поэтому и всего их столько, сколько категорий. */
const ACHIEVEMENT_TOTAL = ACHIEVEMENT_CATEGORIES.length;

/** Для стримера титул `GAME MASTER` важнее уровня: так же, как в чате. */
const rank = computed(() => getRankConfigByLevel(props.profile.lvl, props.profile.isBroadcaster));
const rankBadge = computed(() => RANK_BADGES[Math.min(rank.value.tier, MAX_ICON_TIER)]);

/** Одна роль на карточку, по таблице чата. Бот не может вызвать команду сам, поэтому `isBot` всегда false. */
const role = computed<ChatRole>(() =>
  resolveChatRole({
    isBroadcaster: props.profile.isBroadcaster,
    isBot: false,
    isMod: props.profile.isMod,
    isVip: props.profile.isVip,
    isPermanentVip: props.profile.isPermanentVip,
    isSubscriber: props.profile.isSubscriber,
    isFollower: props.profile.isFollower,
  }),
);
const roleStyle = computed(() => CHAT_ROLE_STYLES[role.value]);

const hero = computed(() => (props.profile.heroId ? getHeroById(props.profile.heroId) : null));
const portraitStyle = computed(() => (props.profile.heroId ? buildHeroPortraitStyle(props.profile.heroId) : {}));

/**
 * Четыре стата героя: знак стата и число. Цвет — у знака, число остаётся графитовым. Шейд 700 держит
 * контраст 4.4:1 на любой из семи бумаг ролей. Размер оптический: щит нарисован на сетке 24, остальные на 512.
 */
const HERO_STAT_LABELS = [
  { key: 'health', label: 'hp', icon: IconHeartPlus, iconClass: 'size-4.5 text-rose-700' },
  { key: 'attack', label: 'atk', icon: IconSword, iconClass: 'size-4.5 text-orange-700' },
  { key: 'defense', label: 'def', icon: IconShield, iconClass: 'size-5 text-sky-700' },
  { key: 'speed', label: 'spd', icon: IconBoot, iconClass: 'size-4.5 text-emerald-700' },
] as const satisfies readonly { key: keyof HeroStats; label: string; icon: Component | string; iconClass: string }[];

/** Статы на том уровне, что у зрителя, а не базовые из магазина; дробные округляются. */
const heroStats = computed(() => {
  const stats = hero.value ? getHeroStats(hero.value.id, props.profile.heroLevel ?? 1) : null;
  return HERO_STAT_LABELS.map((stat) => ({
    ...stat,
    value: stats ? `${Math.round(stats[stat.key] * 10) / 10}` : '—',
  }));
});

/** Полоса — один уровень: `xp`, `startXp` и `maxXp` накопительные, заливка — пройденная часть между порогами. */
const xpProgress = computed(() => {
  const range = props.profile.maxXp - props.profile.startXp;
  if (range <= 0) return 0;
  const percentage = ((props.profile.xp - props.profile.startXp) / range) * 100;
  return Math.min(Math.max(percentage, 0), 100);
});

const XP_CELL_COUNT = 40;
/** Плоские ячейки, не пилюля: последняя заполненная мятная, остальные розовые. */
const XP_CELL_CLASSES = {
  lead: 'bg-sticker-mint',
  filled: 'bg-sticker-rose',
  empty: 'bg-text-inverse/15',
} as const;
const xpCells = computed(() => {
  const filled = Math.floor((xpProgress.value / 100) * XP_CELL_COUNT);
  return Array.from({ length: XP_CELL_COUNT }, (_, index) => {
    if (index >= filled) return XP_CELL_CLASSES.empty;
    if (index === filled - 1) return XP_CELL_CLASSES.lead;
    return XP_CELL_CLASSES.filled;
  });
});

const formatNumber = (value: number): string => value.toLocaleString('en-US');

/** Опыт героя до следующего уровня; на потолке уровня полоса полная и подписана max. */
const heroXp = computed(() => {
  if (!hero.value) return null;
  const level = props.profile.heroLevel ?? 1;
  if (level >= hero.value.maxLevel) return { figures: 'max', progress: 100 };
  const need = heroXpToNext(level);
  const have = Math.min(props.profile.heroXp ?? 0, need);
  return { figures: `${formatNumber(have)} / ${formatNumber(need)}`, progress: (have / need) * 100 };
});
const HERO_XP_CELLS = 20;
const heroXpCells = computed(() => {
  const filled = Math.floor(((heroXp.value?.progress ?? 0) / 100) * HERO_XP_CELLS);
  return Array.from({ length: HERO_XP_CELLS }, (_, index) =>
    index >= filled ? XP_CELL_CLASSES.empty : index === filled - 1 ? XP_CELL_CLASSES.lead : XP_CELL_CLASSES.filled,
  );
});
const xpFigures = computed(() => `${formatNumber(props.profile.xp)} / ${formatNumber(props.profile.maxXp)}`);

const numbers = computed(() => [
  { key: 'coins', label: 'coins', value: formatNumber(props.profile.coins) },
  { key: 'best-streak', label: 'best streak', value: `${props.profile.bestStreak ?? '—'}` },
  { key: 'golden', label: 'golden', value: `${props.profile.goldenBeers}` },
]);

/**
 * Все флаги зрителя, а не одна роль: у `founder` и `lucky vip` своей роли в чате нет. Чип роли, которой
 * окрашена карточка, берёт классы чипа из чата и остаётся единственным тёмным; остальные нейтральные.
 */
const ROLE_FLAGS: readonly {
  key: string;
  label: string;
  /** Цвет чипа: тёмная плашка с цветным контуром, как чипы ролей в чате. */
  classes: string;
  has: (profile: ProfileShowPayload) => boolean;
}[] = [
  { key: 'founder', label: 'founder', classes: 'border-amber-500 bg-amber-950 text-amber-300', has: (profile) => profile.isFounder },
  { key: 'mod', label: 'mod', classes: CHAT_ROLE_STYLES.mod.chip, has: (profile) => profile.isMod },
  { key: 'vip', label: 'vip', classes: CHAT_ROLE_STYLES.vip.chip, has: (profile) => profile.isVip || (profile.isPermanentVip && !profile.isLuckyVip) },
  { key: 'lucky-vip', label: 'lucky vip', classes: 'border-orange-500 bg-orange-950 text-orange-300', has: (profile) => profile.isLuckyVip },
  { key: 'sub', label: 'sub', classes: CHAT_ROLE_STYLES.sub.chip, has: (profile) => profile.isSubscriber },
  { key: 'follower', label: 'follower', classes: CHAT_ROLE_STYLES.follower.chip, has: (profile) => profile.isFollower },
];
const roleFlags = computed(() => ROLE_FLAGS.filter((flag) => flag.has(props.profile)));

/** Четыре самых редких значка слева направо, дальше пустые пунктирные ячейки: ряд не короче четырёх. */
const achievementSlots = computed(() =>
  Array.from({ length: PROFILE_BADGE_SLOTS }, (_, index) => {
    const badge = props.profile.badges[index];
    const category = badge ? findCategory(badge.category) : undefined;
    if (!badge || !category) return null;
    return { ...badge, title: category.title, art: achievementArtPath(category, badge.level) };
  }),
);
</script>

<template>
  <PaperFrame
    class="w-96 bg-linear-to-b text-text-inverse"
    :class="roleStyle.body"
  >
    <div
      class="flex items-center gap-x-2 border-b-2 border-slate-800 bg-linear-to-r px-3 py-2"
      :class="roleStyle.header"
    >
      <component
        :is="rankBadge"
        class="size-12 shrink-0"
      />

      <span class="min-w-0 flex-1">
        <!-- Мягкая полупрозрачная плашка: градиент титула не сливается с цветом шапки роли, но и не бросается в глаза -->
        <span
          class="inline-block max-w-full truncate rounded-md bg-slate-900/55 px-2 py-1 align-middle"
        >
          <span
            class="bg-clip-text text-base leading-none font-extrabold tracking-widest text-transparent uppercase"
            :style="{ backgroundImage: rank.gradient }"
          >
            {{ rank.rankTitle }}
          </span>
        </span>
      </span>

      <LevelBadge
        :level="profile.lvl"
        :is-broadcaster="profile.isBroadcaster"
        :size="48"
        class="shrink-0"
      />
    </div>

    <div class="flex flex-col gap-y-3 px-3 pt-3 pb-3.5">
      <div class="flex gap-x-6">
        <div
          class="size-40 shrink-0 overflow-hidden rounded-full border-2 bg-white/55"
          :class="roleStyle.frame"
        >
          <div
            v-if="profile.heroId"
            class="size-full"
            :style="portraitStyle"
            role="img"
            :aria-label="hero?.name"
          />
          <div
            v-else
            class="flex size-full flex-col items-center justify-center"
          >
            <span class="text-[9px] font-bold tracking-[0.2em] uppercase opacity-45">hero</span>
            <span class="text-xs font-bold opacity-70">none</span>
          </div>
        </div>

        <div class="flex min-w-0 flex-1 flex-col gap-y-1 pt-2">
          <span
            class="truncate text-lg leading-none font-extrabold"
            :style="{ color: profile.color }"
          >
            {{ profile.displayName }}
          </span>

          <div
            v-if="roleFlags.length > 0"
            class="flex flex-wrap gap-1"
          >
            <span
              v-for="flag in roleFlags"
              :key="flag.key"
              class="rounded-md border-2 px-1.5 pt-0.5 pb-px text-[10px] leading-none font-bold tracking-[0.08em] uppercase"
              :class="flag.classes"
            >
              {{ flag.label }}
            </span>
          </div>

          <div class="mt-auto flex flex-col gap-y-1.5 rounded-lg border-2 border-white/70 bg-white/55 px-2.5 py-1.5">
            <div class="flex items-baseline justify-between gap-x-2">
              <span class="truncate text-xl leading-none font-extrabold">{{ hero?.name ?? 'No hero yet' }}</span>
              <span
                v-if="hero"
                class="shrink-0 text-sm leading-none font-bold tracking-[0.08em] uppercase opacity-75"
              >
                lvl {{ profile.heroLevel ?? 1 }}
              </span>
            </div>
            <template v-if="heroXp">
              <div
                class="flex h-2 w-full items-center gap-px"
                role="progressbar"
                :aria-valuenow="Math.round(heroXp.progress)"
                aria-valuemin="0"
                aria-valuemax="100"
                :aria-label="`${hero?.name} xp`"
              >
                <span
                  v-for="(cell, index) in heroXpCells"
                  :key="index"
                  class="h-full flex-1 rounded-xs"
                  :class="cell"
                />
              </div>
              <span class="text-[13px] leading-none font-bold tabular-nums opacity-75">hero xp {{ heroXp.figures }}</span>
            </template>
          </div>
        </div>
      </div>

      <div class="flex flex-col gap-y-1">
        <div class="flex items-baseline justify-between">
          <span class="flex items-center gap-x-1 text-[9.5px] font-bold tracking-[0.17em] uppercase opacity-55">
            <IconLightning
              aria-hidden="true"
              class="size-3"
            />
            xp
          </span>
          <span class="text-[11px] leading-none font-bold tabular-nums">{{ xpFigures }}</span>
        </div>

        <div
          class="flex h-2 w-full items-center gap-0.5"
          role="progressbar"
          :aria-valuenow="Math.round(xpProgress)"
          aria-valuemin="0"
          aria-valuemax="100"
          :aria-label="`${profile.displayName} xp`"
        >
          <span
            v-for="(cell, index) in xpCells"
            :key="index"
            class="h-full flex-1 rounded-xs"
            :class="cell"
          />
        </div>
      </div>

      <div class="grid grid-cols-4 gap-1.5">
        <div
          v-for="stat in heroStats"
          :key="stat.key"
          :data-stat="stat.key"
          class="flex items-center justify-between gap-x-1.5 rounded-lg border-2 border-white/70 bg-white/55 px-2.5 py-1.5"
        >
          <component
            :is="stat.icon"
            aria-hidden="true"
            class="shrink-0"
            :class="stat.iconClass"
          />
          <div class="flex flex-col gap-y-0.5">
            <span class="text-[9px] leading-none font-bold tracking-[0.17em] uppercase opacity-50">{{ stat.label }}</span>
            <span class="text-sm leading-none font-bold tabular-nums">{{ stat.value }}</span>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-3 gap-1.5">
        <div
          v-for="stat in numbers"
          :key="stat.key"
          class="flex flex-col items-center gap-y-0.5 rounded-lg border-2 border-white/70 bg-white/55 py-1"
        >
          <span class="text-[9px] font-bold tracking-[0.17em] uppercase opacity-50">{{ stat.label }}</span>
          <span class="text-sm leading-none font-bold tabular-nums">{{ stat.value }}</span>
        </div>
      </div>

      <div class="flex flex-col gap-y-1.5">
        <span class="flex items-center justify-between">
          <span class="text-[10px] font-bold tracking-[0.17em] uppercase opacity-65">achievements</span>
          <span class="rounded-md border-2 border-white/70 bg-white/55 px-1.5 py-0.5 text-[11px] leading-none font-bold tabular-nums">
            {{ profile.earned }} / {{ ACHIEVEMENT_TOTAL }}
          </span>
        </span>

        <div class="grid grid-cols-4 gap-2">
          <div
            v-for="(slot, index) in achievementSlots"
            :key="slot ? slot.category : `empty-${index}`"
            class="flex aspect-square items-center justify-center rounded-lg border-2"
            :class="slot ? 'border-transparent bg-white/35' : 'border-dashed border-text-inverse/20'"
          >
            <template v-if="slot">
              <img
                v-if="slot.art"
                :src="slot.art"
                :alt="slot.title"
                class="size-full object-contain"
                draggable="false"
              />
              <AchievementIcon
                v-else
                :category="slot.category"
                :rarity="slot.rarity"
                class="size-full"
              />
            </template>
          </div>
        </div>
      </div>
    </div>
  </PaperFrame>
</template>
