<script setup lang="ts">
// OBS Browser Source: 1920×1080, прозрачный фон. Таймер `!timer` колонкой 400 px слева над чатом.
useTransparentPage();
const { $socket } = useNuxtApp();
onMounted(() => $socket.connect());
onBeforeUnmount(() => $socket.disconnect());
</script>

<template>
  <div class="relative h-screen w-screen overflow-hidden bg-transparent">
    <!-- Чат стоит на bottom-36 и 725 px высотой, его верх на 211 px; таймер около 135 px -->
    <div class="absolute top-12 left-0 w-100">
      <TimerWidget />
    </div>
  </div>
</template>
