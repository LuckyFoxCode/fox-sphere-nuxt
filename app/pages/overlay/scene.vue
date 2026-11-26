<script setup lang="ts">
// Вся сцена одной страницей: чат, таймер, шапка стрима с бустом XP, музыка, рулетка и алерты друг на
// друге, как отдельные источники в OBS. Нужна превью в /dev/events: отдельные страницы в dev держат по одному
// долгому соединению (канал ошибок Nuxt) и упираются в лимит Chrome, 6 на адрес, - документ при
// обновлении тогда висит pending. Для боя по-прежнему используются отдельные источники.
// OBS Browser Source: 1920×1080, прозрачный фон.
useTransparentPage();
const { $socket } = useNuxtApp();
const chat = useChatStore();
onMounted(() => $socket.connect());
onBeforeUnmount(() => $socket.disconnect());
</script>

<template>
  <div class="relative h-screen w-screen overflow-hidden bg-transparent">
    <div class="absolute top-12 left-0 w-100">
      <TimerWidget />
    </div>

    <div class="absolute bottom-36 left-0 w-100">
      <ChatWidget :messages="chat.messages" />
    </div>

    <header class="flex w-full justify-end">
      <div class="flex items-center gap-x-2 pt-2 pr-3">
        <RouletteTicker />
        <StreamXpWidget />
      </div>
    </header>

    <div class="absolute top-18.5 right-3">
      <MusicWidget />
    </div>
    <StreamXpBoost />

    <RouletteWidget />

    <div class="absolute bottom-48 left-1/2 -translate-x-1/2">
      <AlertWidget />
    </div>
  </div>
</template>
