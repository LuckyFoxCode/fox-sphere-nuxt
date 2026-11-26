<script setup lang="ts">
// OBS Browser Source: 1920×1080, прозрачный фон. Герои зрителей ходят по нижнему краю, над ними
// ник, титул и последнее сообщение. Зритель появляется после своего сообщения и уходит через 5 минут.
useTransparentPage();
const { $socket } = useNuxtApp();
onMounted(() => $socket.connect());
onBeforeUnmount(() => $socket.disconnect());
</script>

<template>
  <div class="relative h-screen w-screen overflow-hidden bg-transparent">
    <HeroLane />
  </div>
</template>
