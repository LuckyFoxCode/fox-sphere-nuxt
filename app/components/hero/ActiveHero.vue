<script setup lang="ts">
import type { ActiveHero } from '~/stores/heroes';
import { parseTwitchEmotes } from '~/utils/chat/parseTwitchEmotes';
import { getRankConfigByLevel } from '~/utils/chat/ranks';
import { attachHeroLabel, removeHero, spawnHero } from '~/utils/heroLane';

// Подпись над героем: наклейка с ником и титулом и бумажный пузырь с сообщением. Сам спрайт рисует
// Phaser, а эта подпись absolute: сцена двигает её за спрайтом через transform (см. HeroAgent).
const props = defineProps<{ hero: ActiveHero }>();

const label = ref<HTMLElement | null>(null);
const generation = ref<number | null>(null);

const rank = computed(() => getRankConfigByLevel(props.hero.lvl, props.hero.isBroadcaster, props.hero.isBot));

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
    <Transition name="sticker-slap">
      <div
        v-if="bubbleTokens.length"
        class="absolute bottom-full left-1/2 z-10 mb-2 w-max max-w-60 min-w-14 -translate-x-1/2 rounded-xl border-2 border-sticker-edge bg-paper-amber px-2 py-1 text-center text-sm leading-snug font-semibold wrap-break-word text-sticker-body shadow-[0_6px_14px_rgba(0,0,0,0.4)]"
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
            :size="32"
          />
        </template>
      </div>
    </Transition>
    <StickerFrame class="flex-col gap-y-0.5 rounded-xl px-2.5 py-1 leading-none">
      <span
        class="text-[15px] font-bold whitespace-nowrap"
        :style="{ color: hero.color }"
        >{{ hero.displayName }}</span
      >
      <span class="text-sticker-muted text-[11px] font-semibold tracking-wide whitespace-nowrap uppercase">{{
        rank.rankTitle
      }}</span>
    </StickerFrame>
  </div>
</template>
