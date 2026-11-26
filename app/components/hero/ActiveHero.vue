<script setup lang="ts">
import type { ActiveHero } from '~/stores/heroes';
import { CHAT_ROLE_STYLES, resolveChatRole } from '~/utils/chat/chatRoles';
import { parseTwitchEmotes } from '~/utils/chat/parseTwitchEmotes';
import { getRankConfigByLevel } from '~/utils/chat/ranks';
import { attachHeroLabel, removeHero, spawnHero } from '~/utils/heroLane';

// Подпись над героем в стиле старого fox-sphere: ник, титул градиентом ранга, полоска цвета роли и облачко с хвостиком. Сам спрайт рисует
// Phaser, а эта подпись absolute: сцена двигает её за спрайтом через transform (см. HeroAgent).
const props = defineProps<{ hero: ActiveHero }>();

const label = ref<HTMLElement | null>(null);
const generation = ref<number | null>(null);

const rank = computed(() => getRankConfigByLevel(props.hero.lvl, props.hero.isBroadcaster, props.hero.isBot));

// Обводка плашки берётся из тех же стилей ролей, что и рамка сообщения в чате, чтобы цвета совпадали
const roleFrame = computed(() => CHAT_ROLE_STYLES[resolveChatRole({ ...props.hero, isPermanentVip: false })].frame);

// Пузырь короткий: длинное сообщение закрыло бы героя и соседей
const MAX_MESSAGE_CHARS = 48;
const bubbleTokens = computed(() => {
  const message = props.hero.message;
  if (!message) return [];
  const chars = Array.from(message);
  const text = chars.length > MAX_MESSAGE_CHARS ? `${chars.slice(0, MAX_MESSAGE_CHARS).join('')}…` : message;
  return parseTwitchEmotes(text, props.hero.emotes ?? {});
});

const spawn = () => {
  generation.value = spawnHero(props.hero.userId, props.hero.heroId);
  if (label.value) attachHeroLabel(props.hero.userId, label.value);
};

onMounted(spawn);

// Список ключуется по userId, поэтому смена героя (`!use`) не размонтирует компонент, а только
// меняет проп. Мост различает героев по паре userId → heroId, и повторный spawn с другим героем
// заменяет спрайт, а с тем же ничего не делает.
watch(() => props.hero.heroId, spawn);

onBeforeUnmount(() => {
  if (generation.value !== null) removeHero(props.hero.userId, generation.value);
});
</script>

<template>
  <div
    ref="label"
    class="font-quicksand absolute top-0 left-0 flex flex-col items-center will-change-transform"
  >
    <Transition name="bubble-fade">
      <div
        v-if="bubbleTokens.length"
        class="absolute bottom-full left-1/2 z-10 mb-2 w-max max-w-57.5 min-w-14 -translate-x-1/2 rounded-xl border-2 border-[#dccbb2] bg-[#f2dfba] px-2 py-1 text-center text-sm leading-snug font-semibold wrap-break-word text-[#2b2630] shadow-[0_6px_14px_rgba(0,0,0,0.45)]"
      >
        <template
          v-for="(token, index) in bubbleTokens"
          :key="index"
        >
          <span v-if="token.type === 'text'">{{ token.content }}</span>
          <span
            v-else-if="token.type === 'link'"
            class="text-link"
            >{{ token.content }}</span
          >
          <TwitchEmote
            v-else
            :url="token.url"
            :name="token.name"
            :size="36"
          />
        </template>
        <div class="absolute top-full left-1/2 -translate-x-1/2 border-x-[6px] border-t-[7px] border-x-transparent border-t-[#dccbb2]" />
      </div>
    </Transition>
    <div
      class="flex items-center gap-x-2 rounded-lg border-2 bg-[#2b2630]/95 px-2.5 py-0.5 shadow-[0_6px_14px_rgba(0,0,0,0.5)]"
      :class="roleFrame"
    >
      <div class="flex h-full flex-col items-center justify-around leading-none">
        <span
          class="text-[16px] font-bold tracking-wide whitespace-nowrap [text-shadow:0_1px_2px_rgba(0,0,0,0.9)]"
          :style="{ color: hero.color }"
          >{{ hero.displayName }}</span
        >
        <span
          class="bg-clip-text text-[14px] font-semibold tracking-wide text-transparent uppercase"
          :style="{ backgroundImage: rank.gradient }"
          >{{ rank.rankTitle }}</span
        >
      </div>
    </div>
  </div>
</template>
