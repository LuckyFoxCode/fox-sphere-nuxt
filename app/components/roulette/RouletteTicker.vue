<script setup lang="ts">
// Банк рулетки в шапке, перенесён из старого fox-sphere: колесо, «take bank», сумма и чип !spin.
// Пока бот не прислал банк, на месте суммы заглушка. Когда банк растёт (сундук рыбалки, взнос со
// спина), сумма подпрыгивает и вспыхивает золотом; после джекпота, когда он падает, — только смена числа.
const bank = useBankStore();

// Смена числа занимает 140 мс на уход старого: прыгает уже новое
const BUMP_DELAY_MS = 140;
const BUMP_MS = 1100;
const GOLD = '#ffd066';
const INK = '#f2ecf6';

const figure = ref<HTMLElement>();
const shine = ref<HTMLElement>();
let animations: Animation[] = [];

const bump = () => {
  animations.forEach((animation) => animation.cancel());
  const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const timing = { duration: BUMP_MS, delay: BUMP_DELAY_MS, easing: 'ease-out' };
  const jump = (offset: number, transform: string): Keyframe => ({
    offset,
    color: GOLD,
    textShadow: '0 0 12px rgba(255, 181, 46, 0.95)',
    transform: calm ? 'none' : transform,
  });
  const rest: Keyframe = { color: INK, textShadow: '0 0 0 rgba(255, 181, 46, 0)', transform: 'none' };
  animations = [
    figure.value?.animate(
      [
        rest,
        jump(0.2, 'translateY(-3px) scale(1.34)'),
        jump(0.38, 'translateY(1px) scale(0.94)'),
        jump(0.54, 'translateY(-1px) scale(1.12)'),
        jump(0.72, 'none'),
        rest,
      ],
      timing,
    ),
    shine.value?.animate(
      [{ opacity: 0 }, { opacity: 1, offset: 0.2 }, { opacity: 0.7, offset: 0.6 }, { opacity: 0 }],
      timing,
    ),
  ].filter((animation) => animation !== undefined);
};

watch(
  () => bank.total,
  (total, before) => {
    // Первое значение от бота (до него null) — не пополнение
    if (total !== null && typeof before === 'number' && total > before) bump();
  },
);
</script>

<template>
  <StickerFrame role="status" aria-label="Take the roulette bank — command !spin" class="gap-x-2.5 py-1 pr-2 pl-2.5">
    <IconLotteryWheel aria-hidden="true" class="wheel size-7 shrink-0 text-sticker-rose" />

    <!-- Высота ряда равна кольцу ранга в соседней XP-наклейке: обе стоят вровень -->
    <div class="relative flex h-11.5 flex-col justify-center leading-none">
      <span class="text-[10px] font-bold tracking-[0.17em] text-sticker-muted uppercase">take bank</span>
      <span v-if="bank.total === null" aria-hidden="true" class="mt-1 block h-4 w-14 animate-pulse rounded bg-sticker-track" />
      <span v-show="bank.total !== null" ref="figure" class="mt-1 block w-max origin-left">
        <Transition name="reel" mode="out-in">
          <span v-if="bank.total !== null" :key="bank.total" class="block text-lg leading-none font-bold tabular-nums">
            {{ bank.total.toLocaleString('en-US') }}
          </span>
        </Transition>
      </span>
    </div>

    <span class="ml-0.5 rounded-lg bg-sticker-edge px-2 py-0.5 text-sm font-bold tracking-wide text-sticker-body">
      !spin
    </span>

    <!-- Золотая подсветка пополнения: видна только во время прыжка суммы -->
    <span ref="shine" aria-hidden="true" class="shine" />
  </StickerFrame>
</template>

<style scoped>
.wheel {
  animation: wheel 4s linear infinite;
}
@keyframes wheel {
  to {
    rotate: 360deg;
  }
}

.shine {
  position: absolute;
  inset: -2px;
  border: 2px solid #ffd066;
  border-radius: 16px;
  box-shadow:
    0 0 22px rgba(255, 181, 46, 0.75),
    inset 0 0 18px rgba(255, 181, 46, 0.45);
  opacity: 0;
  pointer-events: none;
}

/* Смена суммы: 140 мс вверх-вниз с размытием (DESIGN.md 2.4) */
.reel-enter-active,
.reel-leave-active {
  transition:
    opacity 140ms cubic-bezier(0.16, 1, 0.3, 1),
    transform 140ms cubic-bezier(0.16, 1, 0.3, 1),
    filter 140ms cubic-bezier(0.16, 1, 0.3, 1);
}
.reel-enter-from {
  opacity: 0;
  transform: translateY(0.45em);
  filter: blur(2px);
}
.reel-leave-to {
  opacity: 0;
  transform: translateY(-0.45em);
  filter: blur(2px);
}

@media (prefers-reduced-motion: reduce) {
  .wheel {
    animation: none;
  }
}
</style>
