<script setup lang="ts">
// OBS Browser Source: 1920×1080, прозрачный фон. Чат — колонка 400 px слева, как в сайдбаре
// старого оверлея; у чата свой стиль, это не «графитовые наклейки».
useTransparentPage();
const { $socket } = useNuxtApp();
const chat = useChatStore();
onMounted(() => $socket.connect());
onBeforeUnmount(() => $socket.disconnect());
</script>

<template>
  <div class="relative h-screen w-screen overflow-hidden bg-transparent">
    <div class="absolute bottom-36 left-0 w-100">
      <ChatWidget :messages="chat.messages" />
    </div>
  </div>
</template>
