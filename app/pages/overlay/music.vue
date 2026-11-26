<script setup lang="ts">
// OBS Browser Source: 1920×1080, прозрачный фон. Карточка «Play now» справа сверху, под шапкой стрима.
useTransparentPage();
const { $socket } = useNuxtApp();
onMounted(() => $socket.connect());
onBeforeUnmount(() => $socket.disconnect());
</script>

<template>
  <div class="relative h-screen w-screen overflow-hidden bg-transparent">
    <!-- 74 px: ровно под XP-плашкой шапки стрима (pt-2 + плашка), с тем же правым отступом 12 px -->
    <div class="absolute top-18.5 right-3">
      <MusicWidget />
    </div>
  </div>
</template>
