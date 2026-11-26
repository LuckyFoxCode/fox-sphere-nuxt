<script setup lang="ts">
import type Phaser from 'phaser';

// Полоса героев: прозрачный холст Phaser на весь родитель и подписи над спрайтами. Phaser грузится
// динамически в onMounted: он трогает window и canvas, и на сервере его импорт упал бы. Страницы
// оверлея и так без SSR, но так компонент безопасен и там, где SSR включат.
const heroes = useHeroesStore();
const host = ref<HTMLElement | null>(null);
let game: Phaser.Game | null = null;
let disposed = false;

onMounted(async () => {
  const { createHeroGame } = await import('~/phaser/createHeroGame');
  // Страницу могли закрыть, пока грузился chunk
  if (disposed || !host.value) return;
  game = createHeroGame(host.value);
});

onBeforeUnmount(() => {
  disposed = true;
  game?.destroy(true);
  game = null;
});
</script>

<template>
  <div class="pointer-events-none absolute inset-0 overflow-hidden">
    <div
      ref="host"
      class="absolute inset-0"
    />
    <ActiveHero
      v-for="hero in heroes.list"
      :key="hero.userId"
      :hero="hero"
    />
  </div>
</template>
