<script setup lang="ts">
// Список билетов по !tickets (от 10): имена чипами, лишние — числом. Показывается 7 секунд.
import type { LotteryParticipantsPayload } from '#shared/events';
import { MESSAGES } from '#shared/i18n';
import { LOTTERY_PARTICIPANTS_MAX_NAMES } from '#shared/lottery';

const props = defineProps<{ list: LotteryParticipantsPayload }>();

const texts = computed(() => MESSAGES[props.list.lang].lotteryScene);
const names = computed(() => props.list.names.slice(0, LOTTERY_PARTICIPANTS_MAX_NAMES));
const rest = computed(() => props.list.total - names.value.length);
</script>

<template>
  <StickerFrame
    role="status"
    :aria-label="`${texts.listLabel}: ${texts.listTitle(list.total)}`"
    class="w-165 flex-col items-stretch gap-y-3 px-4 pt-3.5 pb-4"
    style="font-family: 'Quicksand Variable', 'Rubik Variable', sans-serif"
  >
    <header class="flex items-center gap-x-3">
      <div class="flex size-12 shrink-0 items-center justify-center rounded-xl bg-paper-cyan text-sticker-body">
        <IconTicket aria-hidden="true" class="size-8" />
      </div>
      <div class="flex min-w-0 flex-1 flex-col gap-y-1.5">
        <span class="text-[10px] leading-none font-bold tracking-[0.17em] text-sticker-muted uppercase">
          {{ texts.listLabel }}
        </span>
        <span class="truncate text-2xl leading-none font-bold">{{ texts.listTitle(list.total) }}</span>
      </div>
    </header>

    <ul class="grid grid-cols-4 gap-1.5 rounded-xl border border-sticker-edge/25 bg-sticker-well p-2">
      <li
        v-for="(name, index) in names"
        :key="`${index}:${name}`"
        class="chip truncate rounded-md bg-sticker-track px-2 py-1.5 text-center text-sm leading-none font-bold"
        :style="{ '--i': index }"
      >
        {{ name }}
      </li>
      <li
        v-if="rest > 0"
        class="chip truncate rounded-md bg-sticker-edge px-2 py-1.5 text-center text-sm leading-none font-bold text-sticker-body"
        :style="{ '--i': names.length }"
      >
        {{ texts.more(rest) }}
      </li>
    </ul>
  </StickerFrame>
</template>

<style scoped>
.chip {
  animation: chip-in 320ms calc(var(--i) * 18ms) cubic-bezier(0.16, 1, 0.3, 1) both;
}
@keyframes chip-in {
  from {
    opacity: 0;
    transform: translateY(6px) scale(0.94);
  }
}
@media (prefers-reduced-motion: reduce) {
  .chip {
    animation: none;
  }
}
</style>
