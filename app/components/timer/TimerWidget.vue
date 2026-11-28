<script setup lang="ts">
// Таймер `!timer` над чатом: название и цифры на бумаге выбранного цвета. Виден, пока идёт.
// Звук окончания играет здесь, а не в сторе: он нужен только там, где таймер виден.
import { TIMER_SOUND, TIMER_SOUND_VOLUME, timerDigits } from '~/utils/timer';

// compact — для шапки сцены: одна строка (название и цифры) высотой с карточки банка и XP
defineProps<{ compact?: boolean }>();
const timer = useTimerStore();
const digits = computed(() => timerDigits(timer.secondsLeft));

watch(
  () => timer.finished,
  () => {
    const audio = new Audio(TIMER_SOUND);
    audio.volume = TIMER_SOUND_VOLUME;
    // Обычный браузер не даёт играть звук без клика по странице; в OBS ограничения нет
    audio.play().catch((error) => console.warn(`звук таймера не проигран: ${TIMER_SOUND}`, error));
  },
);
</script>

<template>
  <Transition name="sticker-slap" mode="out-in">
    <StickerFrame
      v-if="timer.timer && compact"
      role="timer"
      :aria-label="`${timer.timer.title} — ${digits.join('')}`"
      class="gap-x-3 px-3 py-1.5"
    >
      <h4 class="max-w-44 truncate text-sm leading-none font-bold text-sticker-ink">{{ timer.timer.title }}</h4>
      <div class="flex items-center gap-x-1">
        <template v-for="(char, index) in digits" :key="index">
          <span v-if="char === ':'" class="text-2xl leading-none font-bold text-sticker-ink/55 select-none">:</span>
          <FlipDigit v-else :char="char" :color="timer.timer.color" small />
        </template>
      </div>
    </StickerFrame>
    <StickerFrame
      v-else-if="timer.timer"
      role="timer"
      :aria-label="`${timer.timer.title} — ${digits.join('')}`"
      class="w-full flex-col gap-y-2.5 px-3.5 pt-2.5 pb-3"
    >
      <!-- Название печатается как набрал стример: без капитализации -->
      <h4 class="w-full truncate text-center text-base leading-none font-bold text-sticker-ink">
        {{ timer.timer.title }}
      </h4>
      <div class="flex items-center justify-center gap-x-2">
        <template v-for="(char, index) in digits" :key="index">
          <span v-if="char === ':'" class="text-[34px] leading-none font-bold text-sticker-ink/55 select-none">:</span>
          <FlipDigit v-else :char="char" :color="timer.timer.color" />
        </template>
      </div>
    </StickerFrame>
  </Transition>
</template>
