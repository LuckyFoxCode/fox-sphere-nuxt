<script setup lang="ts">
// Слой сезонных тем сцены. Новая тема — ещё один `v-if` с её компонентом; показывается то, что включено
// в админке («Сезонные события») и подходит по режиму и датам.
const seasons = useSeasons();
const christmas = computed(() => seasons.active('christmas'));

onMounted(seasons.start);
onBeforeUnmount(seasons.stop);
</script>

<template>
  <SeasonChristmas v-if="christmas" :intensity="christmas" />
</template>
