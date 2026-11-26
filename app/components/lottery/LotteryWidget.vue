<script setup lang="ts">
// Лотерея на сцене: затемнение, билеты-конфетти и сама наклейка по центру, вне показа пусто.
// Звук живёт здесь, а не в сторе: он нужен только там, где лотерею видно.
// Звуки из старого fox-sphere: стук (как у награды за баллы) на каждый барабан, add-vip на финал
const LOCK_SOUND = '/assets/sound/knock.wav';
const FINALE_SOUND = '/assets/sound/add-vip.mp3';
const VOLUME = 0.5;

const lottery = useLotteryStore();

const draw = computed(() => (lottery.current?.kind === 'draw' ? lottery.current : null));
const list = computed(() => (lottery.current?.kind === 'participants' ? lottery.current : null));
// Нужно сразу показать, что сцена выходит: билеты и затемнение держатся и в финале
const finale = computed(() => draw.value !== null && lottery.phase === 'finale');

const play = (src: string) => {
  const audio = new Audio(src);
  audio.volume = VOLUME;
  // Обычный браузер не даёт играть звук без клика по странице; в OBS ограничения нет
  audio.play().catch((error) => console.warn(`звук лотереи не проигран: ${src}`, error));
};

watch(
  () => lottery.locked,
  (count, before) => {
    if (draw.value && count > before) play(LOCK_SOUND);
  },
);
watch(finale, (on) => {
  if (on) play(FINALE_SOUND);
});
</script>

<template>
  <div class="pointer-events-none absolute inset-0">
    <Transition name="lottery-shade">
      <span v-if="draw" class="shade" />
    </Transition>

    <template v-if="draw">
      <LotteryTickets v-if="lottery.phase !== 'intro'" :key="`rain-${draw.id}-${lottery.phase}`" mode="rain" />
      <LotteryTickets v-if="finale" :key="`burst-${draw.id}`" mode="burst" />
    </template>

    <!-- Ударная волна в финале: два кольца расходятся от наклейки -->
    <template v-if="finale">
      <span :key="`wave-a-${draw?.id}`" class="wave" />
      <span :key="`wave-b-${draw?.id}`" class="wave late" />
    </template>

    <!-- Наклейка крупнее обычной: розыгрыш — главное событие недели, он не должен теряться на экране -->
    <div class="absolute top-1/2 left-1/2 -translate-1/2" style="scale: 1.2">
      <Transition name="lottery-pop" mode="out-in">
        <LotteryScene v-if="draw" :key="draw.id" :draw="draw.payload" :phase="lottery.phase" :locked="lottery.locked" />
        <LotteryParticipants v-else-if="list" :key="list.id" :list="list.payload" />
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.shade {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at 50% 50%, rgba(32, 16, 34, 0.7) 0%, rgba(24, 14, 30, 0.45) 45%, transparent 78%);
}
.lottery-shade-enter-active,
.lottery-shade-leave-active {
  transition: opacity 500ms ease;
}
.lottery-shade-enter-from,
.lottery-shade-leave-to {
  opacity: 0;
}
/* Вход и выход сцены: чуть крупнее наклейки (DESIGN.md: у события есть только вход, без прыжков) */
.lottery-pop-enter-active {
  transition:
    opacity 380ms cubic-bezier(0.16, 1, 0.3, 1),
    transform 460ms cubic-bezier(0.34, 1.4, 0.64, 1);
}
.lottery-pop-leave-active {
  transition:
    opacity 300ms cubic-bezier(0.4, 0, 1, 1),
    transform 300ms cubic-bezier(0.4, 0, 1, 1);
}
.lottery-pop-enter-from {
  opacity: 0;
  transform: translateY(24px) scale(0.9);
}
.lottery-pop-leave-to {
  opacity: 0;
  transform: scale(0.97);
}
.wave {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 760px;
  height: 640px;
  translate: -50% -50%;
  border-radius: 40px;
  border: 3px solid #ff5f98;
  pointer-events: none;
  animation: wave 1300ms cubic-bezier(0.16, 0.8, 0.3, 1) both;
}
.wave.late {
  border-color: #ffb52e;
  animation-delay: 220ms;
}
@keyframes wave {
  0% {
    opacity: 0.9;
    scale: 0.9;
  }
  100% {
    opacity: 0;
    scale: 1.9;
  }
}
@media (prefers-reduced-motion: reduce) {
  .wave {
    display: none;
  }
  .lottery-pop-enter-active,
  .lottery-pop-leave-active {
    transition: opacity 1ms;
  }
  .lottery-pop-enter-from,
  .lottery-pop-leave-to {
    transform: none;
  }
}
</style>
