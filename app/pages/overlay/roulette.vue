<script setup lang="ts">
// OBS Browser Source: 1920×1080, прозрачный фон. Рулетка по центру, вне вращений страница пустая.
useTransparentPage();
const { $socket } = useNuxtApp();
onMounted(() => $socket.connect());
onBeforeUnmount(() => $socket.disconnect());
</script>

<template>
  <div class="relative h-screen w-screen overflow-hidden bg-transparent">
    <RouletteWidget />
  </div>
</template>
