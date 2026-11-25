<script setup lang="ts">
// Лента карточек: разгон, долгое замедление, чуть «мимо» центра и доводка на выигрышную.
// Компонент живёт одно вращение (родитель задаёт :key).
import type { RouletteSegmentId } from '#shared/roulette';
import { ROULETTE_SPIN_ANIMATION_MS } from '#shared/roulette';
import { segmentView } from '~/utils/roulette/rarity';
import {
  buildTape,
  TAPE_CARD_WIDTH,
  TAPE_GAP,
  TAPE_START_INDEX,
  TAPE_STRIDE,
  TAPE_WINNER_INDEX,
} from '~/utils/roulette/tape';

const props = defineProps<{ winner: RouletteSegmentId; revealed: boolean }>();

const VIEW_WIDTH = 5 * TAPE_STRIDE - TAPE_GAP;
// Доводка в конце: основное движение + она = длительность вращения, которую ждёт бот
const SETTLE_MS = 450;

const tape = buildTape(props.winner);
const offsetFor = (index: number) => VIEW_WIDTH / 2 - (index * TAPE_STRIDE + TAPE_CARD_WIDTH / 2);

const strip = ref<HTMLElement>();
const accent = segmentView(props.winner).style.accent;
let animation: Animation | undefined;

onMounted(() => {
  const target = offsetFor(TAPE_WINNER_INDEX);
  const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Где лента «почти» остановилась: в пределах выигрышной карточки, но не по центру
  const miss = (Math.random() < 0.5 ? -1 : 1) * (26 + Math.random() * 44);
  const at = (x: number) => `translate3d(${x}px, 0, 0)`;
  const braking = (ROULETTE_SPIN_ANIMATION_MS - SETTLE_MS) / ROULETTE_SPIN_ANIMATION_MS;
  animation = strip.value?.animate(
    calm
      ? [{ transform: at(target) }, { transform: at(target) }]
      : [
          { transform: at(offsetFor(TAPE_START_INDEX)), easing: 'cubic-bezier(0.1, 0.62, 0.12, 1)' },
          { transform: at(target + miss), offset: braking, easing: 'cubic-bezier(0.45, 0, 0.25, 1)' },
          { transform: at(target) },
        ],
    { duration: ROULETTE_SPIN_ANIMATION_MS, fill: 'both' },
  );
});
onBeforeUnmount(() => animation?.cancel());

const stateOf = (index: number) => {
  if (!props.revealed) return 'idle';
  return index === TAPE_WINNER_INDEX ? 'win' : 'dim';
};
</script>

<template>
  <div class="relative" :style="{ width: `${VIEW_WIDTH + 48}px`, height: '272px' }">
    <!-- Графитовая дорожка под карточками. Растянута вложенностью: у StickerFrame свой relative -->
    <StickerFrame class="h-full w-full" />

    <!-- Окно шире дорожки по высоте: свечению и частицам выигрыша нужно место -->
    <div class="window absolute -inset-y-36 right-6 left-6">
      <div
        ref="strip"
        class="strip flex w-max shrink-0 items-center"
        :class="{ moving: !revealed }"
        :style="{ gap: `${TAPE_GAP}px` }"
      >
        <RouletteCard v-for="(segment, index) in tape" :key="index" :segment="segment" :state="stateOf(index)" />
      </div>
    </div>

    <!-- Указатель: два овсяных клина над и под центром -->
    <span class="pointer top" :style="{ '--accent': revealed ? accent : undefined }" />
    <span class="pointer bottom" :style="{ '--accent': revealed ? accent : undefined }" />
  </div>
</template>

<style scoped>
.window {
  display: flex;
  align-items: center;
  overflow: hidden;
  mask-image: linear-gradient(90deg, transparent, black 11%, black 89%, transparent);
}
.strip {
  will-change: transform;
}
/* Пока лента летит, блики и мерцание карточек не нужны: их не видно, а рисовать их дорого */
.strip.moving :deep(*) {
  animation: none !important;
}
.strip.moving :deep(.foil),
.strip.moving :deep(.twinkle) {
  display: none;
}

.pointer {
  position: absolute;
  z-index: 5;
  left: 50%;
  width: 38px;
  height: 30px;
  translate: -50% 0;
  background: var(--accent, var(--sticker-edge));
  filter: drop-shadow(0 3px 3px rgba(0, 0, 0, 0.55));
  transition:
    background-color 300ms ease,
    translate 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
}
.pointer.top {
  top: -16px;
  clip-path: polygon(0 0, 100% 0, 50% 100%);
}
.pointer.bottom {
  bottom: -16px;
  clip-path: polygon(50% 0, 100% 100%, 0 100%);
}
</style>
