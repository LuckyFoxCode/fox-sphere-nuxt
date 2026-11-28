<script setup lang="ts">
// Превью сезонных тем: украшения поверх макета сцены 1920×1080 (шапка, таймер, чат, герои, алерт),
// чтобы видно было, что они ничего не перекрывают. К серверу и сокету не подключается.
import type { SeasonIntensity } from '#shared/seasons';

useHead({ title: 'События: превью' });

const intensities: { value: SeasonIntensity; label: string }[] = [
  { value: 'light', label: 'Лёгкая' },
  { value: 'full', label: 'Полная' },
];
const intensity = ref<SeasonIntensity>('light');
const decor = ref(true);

// Как у превью в /dev/events: сцена 1920×1080 уменьшается до ширины блока
const box = ref<HTMLElement>();
const scale = ref(0.5);
let observer: ResizeObserver | undefined;
onMounted(() => {
  observer = new ResizeObserver(([entry]) => {
    if (entry) scale.value = entry.contentRect.width / 1920;
  });
  if (box.value) observer.observe(box.value);
});
onBeforeUnmount(() => observer?.disconnect());
</script>

<template>
  <main class="min-h-screen bg-bg px-8 py-7 font-quicksand text-sticker-ink">
    <header class="flex flex-wrap items-center gap-x-4 gap-y-2">
      <h1 class="text-2xl font-bold">События: Рождество и Новый год</h1>
      <button
        v-for="item in intensities"
        :key="item.value"
        class="rounded-lg px-3 py-2 font-bold"
        :class="decor && intensity === item.value ? 'bg-sticker-edge text-sticker-body' : 'bg-sticker-track'"
        @click="((intensity = item.value), (decor = true))"
      >
        {{ item.label }}
      </button>
      <button
        class="rounded-lg px-3 py-2 font-bold"
        :class="decor ? 'bg-sticker-track' : 'bg-sticker-edge text-sticker-body'"
        @click="decor = false"
      >
        Без украшений
      </button>
    </header>
    <p class="mt-2 text-sm text-sticker-muted">
      Цветные плашки — места виджетов сцены. Украшения лежат под ними и в боковых полосах, центр кадра свободен.
      Включить тему на стриме: админка → События.
    </p>

    <div ref="box" class="stage relative mt-4 w-full overflow-hidden rounded-xl border-2 border-sticker-edge" :style="{ aspectRatio: '16 / 9' }">
      <div class="absolute top-0 left-0 origin-top-left" :style="{ width: '1920px', height: '1080px', transform: `scale(${scale})` }">
        <SeasonChristmas v-if="decor" :key="intensity" :intensity="intensity" />

        <!-- Макет сцены: шапка справа, таймер по центру, музыка под шапкой, чат слева, алерт и герои снизу -->
        <div class="absolute top-2 right-3 h-14 w-[420px] rounded-xl bg-sticker-body border-2 border-sticker-edge" />
        <div class="absolute top-2 left-1/2 h-14 w-[260px] -translate-x-1/2 rounded-xl bg-paper-amber" />
        <div class="absolute top-[74px] right-3 h-[110px] w-[320px] rounded-xl bg-sticker-body border-2 border-sticker-edge" />
        <div class="absolute bottom-36 left-0 h-[340px] w-[400px] rounded-xl bg-paper-blue" />
        <div class="absolute bottom-48 left-1/2 h-24 w-[520px] -translate-x-1/2 rounded-xl bg-paper-rose" />
        <div class="absolute bottom-0 left-0 h-20 w-full bg-sticker-body/40" />
      </div>
    </div>
  </main>
</template>

<style scoped>
/* Тёмный «геймплей» за оверлеем: на нём видно, как лежат полупрозрачные украшения */
.stage {
  background:
    radial-gradient(circle at 18% 12%, #2d3b52, transparent 46%),
    radial-gradient(circle at 82% 78%, #3a2b45, transparent 52%),
    #151922;
}
</style>
