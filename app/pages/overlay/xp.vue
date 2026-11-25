<script setup lang="ts">
// OBS Browser Source: 1920×1080, прозрачный фон. XP-карточка справа сверху, level-up снизу по центру.
useTransparentPage();
const { $socket } = useNuxtApp();
onMounted(() => $socket.connect());
onBeforeUnmount(() => $socket.disconnect());
</script>

<template>
  <div class="relative h-screen w-screen overflow-hidden bg-transparent">
    <div class="absolute top-2 right-3">
      <XpWidget />
    </div>
    <div class="absolute bottom-48 left-1/2 -translate-x-1/2">
      <LevelUpSticker />
    </div>
  </div>
</template>
