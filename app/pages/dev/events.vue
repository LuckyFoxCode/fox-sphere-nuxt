<script setup lang="ts">
// Эмулятор событий без Twitch: кнопки шлют dev-события на сервер бота, он рассылает их оверлеям
// как настоящие. Справа — превью /overlay/xp. Нужен запущенный бот (pnpm dev) и DEV_EVENTS != false.
import { getXpThresholdForLevel } from '#shared/xp';

const { $socket } = useNuxtApp();
const xp = useXpStore();

const username = ref('TestViewer');
const lvl = ref(3);
const amount = ref(3);
const status = ref('');

const send = (event: 'dev:xp-gain' | 'dev:level-up', payload: unknown) => {
  $socket.emit(event, payload, (result) => {
    status.value = result.ok ? 'отправлено' : `отклонено: ${result.reason ?? '?'}`;
  });
};

const base = () => ({ twitchId: `dev-${username.value.toLowerCase()}`, username: username.value });

// totalXp = середина уровня, чтобы полоса была видна
const midXp = () => Math.floor((getXpThresholdForLevel(lvl.value - 1) + getXpThresholdForLevel(lvl.value)) / 2);

const gain = () =>
  send('dev:xp-gain', { ...base(), amount: amount.value, totalXp: midXp(), lvl: lvl.value });

const levelUp = () => send('dev:level-up', { ...base(), fromLvl: lvl.value, toLvl: lvl.value + 1 });

// Как настоящий уровень: полоса добирается до 100%, затем level-up
const gainWithLevelUp = () => {
  send('dev:xp-gain', {
    ...base(),
    amount: amount.value,
    totalXp: getXpThresholdForLevel(lvl.value),
    lvl: lvl.value,
  });
  send('dev:level-up', { ...base(), fromLvl: lvl.value, toLvl: lvl.value + 1 });
  lvl.value += 1;
};

const burst = () => {
  for (const [index, name] of ['Fox', 'Lynx', 'Wolf'].entries()) {
    setTimeout(() => {
      send('dev:xp-gain', {
        twitchId: `dev-${name}`,
        username: name,
        amount: 1 + index,
        totalXp: getXpThresholdForLevel(4) - 30 + index * 40,
        lvl: 5,
      });
    }, index * 800);
  }
};

onMounted(() => $socket.connect());
onBeforeUnmount(() => $socket.disconnect());

// Превью 1920×1080, уменьшенное под ширину блока
const box = ref<HTMLElement>();
const scale = ref(0.4);
onMounted(() => {
  const observer = new ResizeObserver(([entry]) => {
    if (entry) scale.value = entry.contentRect.width / 1920;
  });
  if (box.value) observer.observe(box.value);
  onBeforeUnmount(() => observer.disconnect());
});

const connectionLabel = { connecting: 'подключаюсь…', connected: 'подключён', disconnected: 'нет связи' };
</script>

<template>
  <main class="min-h-screen bg-sticker-well p-6 font-quicksand text-sticker-ink">
    <h1 class="text-2xl font-bold">Эмулятор событий</h1>
    <p class="mt-1 text-sm text-sticker-muted">
      Сокет: {{ connectionLabel[xp.connection] }}. Бот должен быть запущен (<code>pnpm dev</code>).
    </p>

    <div class="mt-5 flex flex-wrap gap-x-8 gap-y-6">
      <section class="flex w-80 flex-col gap-y-3">
        <label class="flex flex-col gap-y-1 text-xs font-bold tracking-widest text-sticker-muted uppercase">
          Ник
          <input v-model="username" class="rounded-lg bg-sticker-track px-3 py-2 text-base text-sticker-ink normal-case" />
        </label>
        <label class="flex flex-col gap-y-1 text-xs font-bold tracking-widest text-sticker-muted uppercase">
          Уровень (до события)
          <input v-model.number="lvl" type="number" min="1" class="rounded-lg bg-sticker-track px-3 py-2 text-base text-sticker-ink" />
        </label>
        <label class="flex flex-col gap-y-1 text-xs font-bold tracking-widest text-sticker-muted uppercase">
          XP за сообщение
          <input v-model.number="amount" type="number" min="1" class="rounded-lg bg-sticker-track px-3 py-2 text-base text-sticker-ink" />
        </label>
        <button class="rounded-lg bg-sticker-edge px-3 py-2 font-bold text-sticker-body" @click="gain">+XP</button>
        <button class="rounded-lg bg-sticker-edge px-3 py-2 font-bold text-sticker-body" @click="levelUp">Только level up</button>
        <button class="rounded-lg bg-sticker-edge px-3 py-2 font-bold text-sticker-body" @click="gainWithLevelUp">+XP и level up (как в бою)</button>
        <button class="rounded-lg bg-sticker-track px-3 py-2 font-bold" @click="burst">Серия от трёх зрителей</button>
        <p class="text-sm text-sticker-muted">{{ status }}</p>
      </section>

      <section class="min-w-[24rem] flex-1">
        <div ref="box" class="relative w-full overflow-hidden rounded-xl border-2 border-sticker-edge checker" :style="{ height: `${1080 * scale}px` }">
          <iframe
            src="/overlay/xp"
            class="absolute top-0 left-0 origin-top-left border-0"
            :style="{ width: '1920px', height: '1080px', transform: `scale(${scale})` }"
          />
        </div>
      </section>
    </div>
  </main>
</template>

<style scoped>
.checker {
  background-color: #3a3440;
  background-image:
    linear-gradient(45deg, #2f2a35 25%, transparent 25%, transparent 75%, #2f2a35 75%),
    linear-gradient(45deg, #2f2a35 25%, transparent 25%, transparent 75%, #2f2a35 75%);
  background-size: 24px 24px;
  background-position: 0 0, 12px 12px;
}
</style>
