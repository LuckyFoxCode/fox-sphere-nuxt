<script setup lang="ts">
// Розыгрыш VIP: графитовая наклейка с заголовком, потоком имён и барабанами по местам. Барабаны
// встают с последнего места к первому, цвета мест — те же, что у редкостей рулетки (пятое «common»
// … первое «jackpot»). Весь показ идёт по фиксированным таймингам из shared/lottery.ts, поэтому от
// числа участников не зависит: их больше — поток имён гуще, меньше — между именами значки.
import type { LotteryDrawPayload } from '#shared/events';
import IconCrown from '~/components/icons/IconCrown.vue';
import IconStar from '~/components/icons/IconStar.vue';
import IconTicket from '~/components/icons/IconTicket.vue';
import { MESSAGES } from '#shared/i18n';
import { LOTTERY_DRAW_MS, LOTTERY_INTRO_MS, lotteryReelMs } from '#shared/lottery';
import type { LotteryPhase } from '~/stores/lottery';
import { buildReelTape, buildStream } from '~/utils/lottery/tape';
import { RARITY_STYLES } from '~/utils/roulette/rarity';

const props = defineProps<{ draw: LotteryDrawPayload; phase: LotteryPhase; locked: number }>();

const texts = computed(() => MESSAGES[props.draw.lang].lotteryScene);
const count = computed(() => props.draw.winners.length);

// Место → редкость рулетки: от первого к пятому
const PLACE_ACCENTS = [
  RARITY_STYLES.jackpot.accent,
  RARITY_STYLES.legendary.accent,
  RARITY_STYLES.epic.accent,
  RARITY_STYLES.rare.accent,
  RARITY_STYLES.common.accent,
];

const pool = computed(() => [...new Set([...props.draw.entries, ...props.draw.winners.map((w) => w.username)])]);

const rows = computed(() =>
  props.draw.winners.map((winner, index) => {
    const place = index + 1;
    return {
      place,
      winner,
      accent: PLACE_ACCENTS[index]!,
      reelMs: lotteryReelMs(place, count.value),
      ...buildReelTape(pool.value, winner.username, `${props.draw.id}:${place}`),
    };
  }),
);

const stream = computed(() => buildStream(pool.value, props.draw.id));

// Барабан места встал, когда встали все места ниже него
const isLocked = (place: number) => props.locked >= count.value - place + 1;
const spinning = computed(() => props.phase !== 'intro');
const finale = computed(() => props.phase === 'finale');

const subtitle = computed(() => ({ intro: texts.value.intro, draw: texts.value.drawing, finale: texts.value.finale })[props.phase]);

// Счётчик участников набегает за заставку, сколько бы их ни было
const COUNT_MS = 1300;
const shown = ref(0);
let frame = 0;
onMounted(() => {
  const start = performance.now();
  const step = (now: number) => {
    const progress = Math.min((now - start) / COUNT_MS, 1);
    shown.value = Math.round(props.draw.total * (1 - (1 - progress) ** 3));
    if (progress < 1) frame = requestAnimationFrame(step);
  };
  frame = requestAnimationFrame(step);
});
onBeforeUnmount(() => cancelAnimationFrame(frame));

// Поток имён едет всё время, пока идут заставка и розыгрыш, и тормозит вместе с барабанами
const streamEl = ref<HTMLElement>();
const streamBox = ref<HTMLElement>();
let streamAnimation: Animation | undefined;
onMounted(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const strip = streamEl.value;
  const box = streamBox.value;
  if (!strip || !box) return;
  const distance = Math.max(0, strip.scrollWidth - box.clientWidth);
  streamAnimation = strip.animate(
    [{ transform: 'translate3d(0,0,0)' }, { transform: `translate3d(${-distance}px,0,0)` }],
    { duration: LOTTERY_INTRO_MS + LOTTERY_DRAW_MS, easing: 'cubic-bezier(0.2, 0.55, 0.2, 1)', fill: 'both' },
  );
});
onBeforeUnmount(() => streamAnimation?.cancel());

const DECO_ICONS = { ticket: IconTicket, star: IconStar, crown: IconCrown } as const;
</script>

<template>
  <StickerFrame
    role="status"
    :aria-label="`${texts.label} — ${texts.title}: ${draw.winners.map((w) => w.username).join(', ')}`"
    class="panel w-165 flex-col items-stretch gap-y-3 px-4 pt-4 pb-4"
    :class="{ 'is-finale': finale }"
  >
    <header class="flex items-center gap-x-3">
      <div class="plate flex size-14 shrink-0 items-center justify-center rounded-xl bg-paper-cyan text-sticker-body">
        <IconTicket aria-hidden="true" class="size-9" :class="{ shake: phase === 'intro' }" />
      </div>
      <div class="flex min-w-0 flex-1 flex-col gap-y-1.5">
        <span class="text-[10px] leading-none font-bold tracking-[0.17em] text-sticker-muted uppercase">
          {{ texts.label }}
        </span>
        <span class="truncate text-3xl leading-none font-bold">{{ texts.title }}</span>
        <Transition name="swap" mode="out-in">
          <span :key="phase" class="truncate text-sm leading-none font-medium text-sticker-muted">{{ subtitle }}</span>
        </Transition>
      </div>
      <div class="flex min-w-24 shrink-0 flex-col items-center gap-y-1 rounded-xl bg-sticker-track px-3 py-2">
        <span class="text-3xl leading-none font-bold tabular-nums">{{ shown.toLocaleString('en-US') }}</span>
        <span class="text-[10px] leading-none font-bold tracking-[0.17em] text-sticker-muted uppercase">
          {{ texts.entries }}
        </span>
      </div>
    </header>

    <!-- Поток имён: схлопывается к финалу, высота панели плавно уменьшается -->
    <div class="stream-wrap" :class="{ closed: finale }" aria-hidden="true">
      <div class="stream-inner">
        <div ref="streamBox" class="stream rounded-xl border border-sticker-edge/25 bg-sticker-well">
          <div ref="streamEl" class="flex w-max items-center gap-x-2 px-2 py-1.5">
            <template v-for="(item, index) in stream" :key="index">
              <span
                v-if="item.kind === 'name'"
                class="rounded-md bg-sticker-track px-2 py-1 text-sm leading-none font-bold whitespace-nowrap"
              >
                {{ item.text }}
              </span>
              <component
                :is="DECO_ICONS[item.icon]"
                v-else-if="item.kind === 'deco'"
                class="size-4 shrink-0 text-sticker-muted/70"
              />
            </template>
          </div>
        </div>
      </div>
    </div>

    <ol class="flex flex-col gap-y-2">
      <li
        v-for="row in rows"
        :key="`${draw.id}:${row.place}`"
        class="row relative flex items-center gap-x-3 rounded-xl border bg-sticker-well py-1.5 pr-2 pl-2"
        :class="{ locked: isLocked(row.place), 'is-first': row.place === 1 }"
        :style="{ '--accent': row.accent, '--i': row.place }"
      >
        <span
          class="num flex size-12 shrink-0 items-center justify-center rounded-xl text-2xl leading-none font-bold text-sticker-body tabular-nums"
        >
          {{ row.place }}
        </span>

        <LotteryReel
          :items="row.items"
          :stop-index="row.stopIndex"
          :duration-ms="row.reelMs"
          :spinning="spinning"
          :locked="isLocked(row.place)"
        />

        <div class="flex h-10 w-36 shrink-0 items-center justify-center">
          <Transition name="chip">
            <span
              v-if="isLocked(row.place)"
              class="chip flex items-center gap-x-1.5 rounded-lg px-2 py-1.5 text-[11px] leading-none font-bold tracking-[0.08em] whitespace-nowrap text-sticker-body uppercase"
            >
              <IconCrown aria-hidden="true" class="size-4" />
              {{ row.winner.returning ? texts.extended : texts.newVip }}
            </span>
            <span v-else class="h-1.5 w-12 rounded-full bg-sticker-track" />
          </Transition>
        </div>

        <span v-if="isLocked(row.place)" class="lock-flash" />
        <span v-if="finale" class="foil" />
      </li>
    </ol>

    <footer class="flex h-6 items-center">
      <Transition name="swap" mode="out-in">
        <div v-if="!finale" key="cells" class="flex w-full items-center gap-x-3">
          <div class="flex flex-1 gap-x-0.5">
            <span
              v-for="cell in count"
              :key="cell"
              class="h-2.5 flex-1 rounded-xs transition-colors duration-700"
              :class="cell < locked ? 'bg-sticker-rose' : cell === locked ? 'bg-sticker-mint' : 'bg-sticker-track'"
            />
          </div>
          <span class="text-xs font-bold text-sticker-muted tabular-nums">{{ locked }}/{{ count }}</span>
        </div>
        <div v-else key="until" class="flex w-full items-center justify-between">
          <span class="rounded-md bg-sticker-edge px-2 py-1 text-[10px] leading-none font-bold tracking-[0.12em] text-sticker-body uppercase">
            {{ texts.until }}
          </span>
          <span class="text-xs font-bold text-sticker-muted tabular-nums">{{ count }} / {{ draw.total.toLocaleString('en-US') }}</span>
        </div>
      </Transition>
    </footer>
  </StickerFrame>
</template>

<style scoped>
.panel {
  font-family: 'Quicksand Variable', 'Rubik Variable', sans-serif;
}
.panel.is-finale {
  animation: beat 520ms cubic-bezier(0.34, 1.56, 0.64, 1);
}
.shake {
  animation: shake 900ms ease-in-out 2;
  transform-origin: 50% 60%;
}

.stream-wrap {
  display: grid;
  grid-template-rows: 1fr;
  transition:
    grid-template-rows 520ms cubic-bezier(0.16, 1, 0.3, 1),
    opacity 320ms ease,
    margin 520ms cubic-bezier(0.16, 1, 0.3, 1);
}
.stream-wrap.closed {
  grid-template-rows: 0fr;
  opacity: 0;
  margin-top: -12px;
}
.stream-inner {
  min-height: 0;
  overflow: hidden;
}
.stream {
  overflow: hidden;
  mask-image: linear-gradient(90deg, transparent, black 7%, black 93%, transparent);
}

.row {
  border-color: color-mix(in srgb, var(--sticker-edge) 25%, transparent);
  transition: border-color 300ms ease;
}
.row .num {
  background: var(--sticker-track);
  color: var(--sticker-muted);
  transition:
    background-color 300ms ease,
    color 300ms ease;
}
.row.locked {
  border-color: var(--accent);
  animation: ring 700ms ease-out;
}
.row.locked .num {
  background: var(--accent);
  color: var(--sticker-body);
}
.chip {
  background: var(--accent);
}
.chip-enter-active {
  animation: chip-in 460ms cubic-bezier(0.34, 1.56, 0.64, 1);
}
.chip-leave-active {
  display: none;
}

.lock-flash {
  position: absolute;
  inset: -1px;
  border-radius: 12px;
  pointer-events: none;
  background: var(--accent);
  animation: flash 650ms ease-out both;
}
/* Блик по строке в финале: одна полоса, поочерёдно сверху вниз */
.foil {
  position: absolute;
  inset: 0;
  overflow: hidden;
  border-radius: 12px;
  pointer-events: none;
}
.foil::after {
  content: '';
  position: absolute;
  inset: -20% auto -20% 0;
  width: 26%;
  background: linear-gradient(100deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  translate: -140% 0;
  animation: sweep 900ms calc(var(--i) * 170ms + 250ms) ease-in-out both;
}
.row.is-first.locked {
  box-shadow: 0 0 0 1px var(--accent);
}

.swap-enter-active,
.swap-leave-active {
  transition:
    opacity 180ms ease,
    transform 180ms ease;
}
.swap-enter-from {
  opacity: 0;
  transform: translateY(4px);
}
.swap-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

@keyframes beat {
  0% {
    transform: scale(1);
  }
  45% {
    transform: scale(1.035);
  }
  100% {
    transform: scale(1);
  }
}
@keyframes shake {
  0%,
  100% {
    rotate: 0deg;
  }
  25% {
    rotate: -9deg;
  }
  75% {
    rotate: 9deg;
  }
}
@keyframes ring {
  0% {
    box-shadow: 0 0 0 0 var(--accent);
  }
  100% {
    box-shadow: 0 0 0 16px transparent;
  }
}
@keyframes flash {
  0% {
    opacity: 0.5;
  }
  100% {
    opacity: 0;
  }
}
@keyframes chip-in {
  0% {
    opacity: 0;
    transform: scale(0.4) rotate(-6deg);
  }
  100% {
    opacity: 1;
    transform: scale(1) rotate(0);
  }
}
@keyframes sweep {
  to {
    translate: 520% 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .panel.is-finale,
  .shake,
  .row.locked,
  .chip-enter-active,
  .lock-flash,
  .foil::after {
    animation: none;
  }
  .lock-flash,
  .foil {
    display: none;
  }
  .stream-wrap {
    transition: none;
  }
}
</style>
