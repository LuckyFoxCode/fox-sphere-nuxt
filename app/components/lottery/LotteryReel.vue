<script setup lang="ts">
// Барабан одного места: лента имён едет вверх и тормозит ровно на победителе. Длительность задана
// снаружи (shared/lottery.ts) и от длины ленты не зависит: ленту «сжимает» и «растягивает» скорость,
// а не время. Компонент живёт один розыгрыш (родитель задаёт :key).
import IconCrown from '~/components/icons/IconCrown.vue';
import IconStar from '~/components/icons/IconStar.vue';
import IconTicket from '~/components/icons/IconTicket.vue';
import { REEL_ITEM_H, type ReelItem } from '~/utils/lottery/tape';

const props = defineProps<{
  items: ReelItem[];
  stopIndex: number;
  /** Сколько лента едет от старта розыгрыша до остановки */
  durationMs: number;
  /** Розыгрыш начался: лента едет */
  spinning: boolean;
  /** Барабан остановился на победителе */
  locked: boolean;
}>();

// Длинные ники (до 25 символов) печатаются мельче, чтобы чаще помещаться целиком
const LONG_NAME = 17;

const ICONS = { ticket: IconTicket, star: IconStar, crown: IconCrown } as const;

const strip = ref<HTMLElement>();
const windowEl = ref<HTMLElement>();
const calm = ref(false);
const target = computed(() => props.stopIndex * REEL_ITEM_H);
const at = (y: number) => `translate3d(0, ${-y}px, 0)`;
let animations: Animation[] = [];

onMounted(() => {
  calm.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
});

watch(
  () => props.spinning,
  (on) => {
    if (!on || calm.value || !strip.value) return;
    // Долгий разгон-торможение, на финише чуть «мимо» и доводка: как у ленты рулетки, но по вертикали
    animations.push(
      strip.value.animate(
        [
          { transform: at(0), easing: 'cubic-bezier(0.22, 0.55, 0.12, 1)' },
          { transform: at(target.value + 20), offset: 0.93, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' },
          { transform: at(target.value) },
        ],
        { duration: props.durationMs, fill: 'both' },
      ),
    );
    // Размытие на скорости: окно маленькое, поэтому фильтр дёшев
    animations.push(
      windowEl.value?.animate(
        [{ filter: 'blur(2.6px)' }, { filter: 'blur(1.4px)', offset: 0.55 }, { filter: 'blur(0px)', offset: 0.9 }],
        { duration: props.durationMs, fill: 'both' },
      ) as Animation,
    );
  },
  { flush: 'post' },
);
onBeforeUnmount(() => animations.forEach((animation) => animation?.cancel()));

// Без анимации барабан просто показывает победителя, когда встал
const staticY = computed(() => (calm.value && props.locked ? target.value : 0));
</script>

<template>
  <div ref="windowEl" class="window relative min-w-0 flex-1 overflow-hidden" :style="{ height: `${REEL_ITEM_H}px` }">
    <div ref="strip" class="strip" :style="calm ? { transform: at(staticY) } : undefined">
      <div
        v-for="(item, index) in items"
        :key="index"
        class="flex items-center gap-x-3 pr-2"
        :class="{ win: locked && index === stopIndex }"
        :style="{ height: `${REEL_ITEM_H}px` }"
      >
        <span v-if="item.kind === 'mystery'" class="text-3xl font-bold tracking-[0.3em] text-sticker-muted/60">???</span>
        <span
          v-else-if="item.kind === 'name'"
          class="truncate leading-tight font-bold"
          :class="item.text.length > LONG_NAME ? 'text-2xl' : 'text-3xl'"
        >
          {{ item.text }}
        </span>
        <component :is="ICONS[item.icon]" v-else aria-hidden="true" class="size-7 text-sticker-muted/70" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.window {
  /* Края ленты тают: имена выезжают из тени, а не из линии */
  mask-image: linear-gradient(180deg, transparent 0, black 16%, black 84%, transparent 100%);
}
.strip {
  will-change: transform;
}
.win span {
  transform-origin: left center;
  animation: pop 420ms cubic-bezier(0.34, 1.56, 0.64, 1) both;
}
@keyframes pop {
  0% {
    transform: scale(0.92);
  }
  55% {
    transform: scale(1.07);
  }
  100% {
    transform: scale(1);
  }
}
@media (prefers-reduced-motion: reduce) {
  .win span {
    animation: none;
  }
}
</style>
