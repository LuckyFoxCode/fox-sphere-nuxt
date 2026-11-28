<script setup lang="ts">
// OBS Browser Source: 1920×1080, прозрачный фон. Арена башни справа внизу; вне боя пусто.
useTransparentPage();
const { $socket } = useNuxtApp();
onMounted(() => $socket.connect());
onBeforeUnmount(() => $socket.disconnect());
</script>

<template>
  <div class="relative h-screen w-screen overflow-hidden bg-transparent">
    <TowerWidget />
  </div>
</template>
