<script setup lang="ts">
// OBS Browser Source: 1920×1080, прозрачный фон. Лотерея по центру, вне розыгрыша страница пустая.
useTransparentPage();
const { $socket } = useNuxtApp();
onMounted(() => $socket.connect());
onBeforeUnmount(() => $socket.disconnect());
</script>

<template>
  <div class="relative h-screen w-screen overflow-hidden bg-transparent">
    <LotteryWidget />
  </div>
</template>
