<script setup lang="ts">
// Текущее вращение из очереди: кто крутит, лента и итог; джекпот занимает весь экран и играет звук.
// Звук живёт здесь, а не в сторе: он нужен только там, где рулетку видно.
import { toSegmentId } from '#shared/roulette';
import { segmentView } from '~/utils/roulette/rarity';

// Громкость и звук из старого fox-sphere: других звуков у рулетки там не было
const JACKPOT_SOUND = '/assets/sound/jackpot.mp3';
const VOLUME = 0.5;

const roulette = useRouletteStore();

const winner = computed(() => (roulette.current ? toSegmentId(roulette.current) : null));
const accent = computed(() => (winner.value ? segmentView(winner.value).style.accent : undefined));
const revealed = computed(() => roulette.phase !== 'spinning');
const showTape = computed(() => roulette.current !== null && roulette.phase !== 'jackpot');
const showJackpot = computed(() => roulette.current !== null && roulette.phase === 'jackpot');

const resultText = computed(() => {
  const spin = roulette.current;
  if (!spin) return '';
  switch (spin.prizeType) {
    case 'coins':
      return `+${spin.coinAmount} coins`;
    case 'xp':
      return `+${spin.xpAmount} XP`;
    case 'jackpot':
      return 'JACKPOT!';
    case 'empty':
      return 'nothing this time';
  }
});

// Звук — в момент, когда лента встала на джекпоте, как в старом оверлее
watch(
  () => roulette.current && roulette.phase === 'result' && roulette.current.jackpotWon,
  (hit) => {
    if (!hit) return;
    const audio = new Audio(JACKPOT_SOUND);
    audio.volume = VOLUME;
    // Обычный браузер не даёт играть звук без клика по странице; в OBS ограничения нет
    audio.play().catch((error) => console.warn(`звук джекпота не проигран: ${JACKPOT_SOUND}`, error));
  },
);
</script>

<template>
  <div class="relative h-full w-full">
    <div class="absolute top-1/2 left-1/2 -translate-1/2">
      <Transition name="sticker-slap" mode="out-in">
        <div v-if="showTape && roulette.current && winner" :key="roulette.current.id" class="flex flex-col items-center">
          <StickerFrame class="mb-10 gap-x-3 py-2 pr-5 pl-2.5">
            <div class="flex size-11 shrink-0 items-center justify-center rounded-xl bg-paper-purple text-sticker-body">
              <IconLotteryWheel aria-hidden="true" class="size-7" :class="{ whirl: !revealed }" />
            </div>
            <div class="flex flex-col gap-y-1.5">
              <span class="text-[10px] leading-none font-bold tracking-[0.17em] text-sticker-muted uppercase">
                spins the wheel
              </span>
              <span class="max-w-80 truncate text-xl leading-none font-bold">{{ roulette.current.username }}</span>
            </div>
          </StickerFrame>

          <RouletteReel :winner="winner" :revealed="revealed" />

          <!-- Место под итог занято всегда: лента не прыгает, когда он появляется -->
          <div class="mt-12 flex h-18 items-start">
            <Transition name="sticker-slap">
              <StickerFrame v-if="revealed" role="status" class="px-7 py-3">
                <span class="result text-4xl leading-none font-bold tabular-nums" :style="{ color: accent }">
                  {{ resultText }}
                </span>
              </StickerFrame>
            </Transition>
          </div>
        </div>
      </Transition>
    </div>

    <Transition name="sticker-slap">
      <RouletteJackpot
        v-if="showJackpot && roulette.current"
        :key="roulette.current.id"
        :username="roulette.current.username"
        :amount="roulette.current.coinAmount"
        :bank-after="roulette.current.jackpotTotalAfter"
      />
    </Transition>
  </div>
</template>

<style scoped>
.result {
  text-shadow: 0 3px 0 rgba(0, 0, 0, 0.4);
}
.whirl {
  animation: whirl 0.9s linear infinite;
}
@keyframes whirl {
  to {
    rotate: 360deg;
  }
}
@media (prefers-reduced-motion: reduce) {
  .whirl {
    animation: none;
  }
}
</style>
