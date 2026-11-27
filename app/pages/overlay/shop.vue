<script setup lang="ts">
// OBS Browser Source: 1920×1080, прозрачный фон. Окно магазина по команде !shop.
useTransparentPage();
const { $socket } = useNuxtApp();
onMounted(() => $socket.connect());
onBeforeUnmount(() => $socket.disconnect());
</script>

<template>
  <div class="relative h-screen w-screen overflow-hidden bg-transparent">
    <ShopWidget />
  </div>
</template>
