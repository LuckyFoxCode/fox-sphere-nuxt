<script setup lang="ts">
// OBS Browser Source: 1920×1080, прозрачный фон. Шапка стрима справа сверху.
useTransparentPage();
const { $socket } = useNuxtApp();
onMounted(() => $socket.connect());
onBeforeUnmount(() => $socket.disconnect());
</script>

<template>
  <div class="relative h-screen w-screen overflow-hidden bg-transparent">
    <header class="flex w-full justify-end">
      <div class="flex items-center gap-x-2 pt-2 pr-3">
        <!-- Здесь, слева от XP, встанет банк монет рулетки. Ряд прижат вправо, XP не сдвинется. -->
        <StreamXpWidget />
      </div>
    </header>
  </div>
</template>
