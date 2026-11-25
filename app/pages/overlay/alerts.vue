<script setup lang="ts">
// OBS Browser Source: 1920×1080, прозрачный фон. Алерты по одному снизу по центру (DESIGN.md, раздел 3).
useTransparentPage();
const { $socket } = useNuxtApp();
onMounted(() => $socket.connect());
onBeforeUnmount(() => $socket.disconnect());
</script>

<template>
  <div class="relative h-screen w-screen overflow-hidden bg-transparent">
    <div class="absolute bottom-48 left-1/2 -translate-x-1/2">
      <AlertWidget />
    </div>
  </div>
</template>
