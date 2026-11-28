<script setup lang="ts">
// Вся сцена одной страницей: герои, чат, таймер, шапка стрима с бустом XP, музыка, рулетка, лотерея, карточка профиля, лидерборд, окно магазина и алерты друг на
// друге, как отдельные источники в OBS. Нужна превью в /dev/events: отдельные страницы в dev держат по одному
// долгому соединению (канал ошибок Nuxt) и упираются в лимит Chrome, 6 на адрес, - документ при
// обновлении тогда висит pending. Для боя по-прежнему используются отдельные источники.
// OBS Browser Source: 1920×1080, прозрачный фон.
useTransparentPage();
const { $socket } = useNuxtApp();
const chat = useChatStore();
const widgets = useWidgets();
const webcam = computed(() => widgets.on('webcam'));
onMounted(() => {
  $socket.connect();
  widgets.start();
});
onBeforeUnmount(() => {
  $socket.disconnect();
  widgets.stop();
});
</script>

<template>
  <div class="relative h-screen w-screen overflow-hidden bg-transparent">
    <!-- Сезонные украшения (Рождество и др.) самым нижним слоем: всё остальное рисуется поверх них -->
    <SeasonLayer />

    <!-- Герои первыми: идут под всеми остальными слоями, как нижний этаж сцены -->
    <HeroLane v-if="widgets.on('heroes')" />

    <!-- Таймер в центре шапки, на одной линии с банком и XP: так он не занимает колонку слева -->
    <div v-if="widgets.on('timer')" class="absolute top-2 left-1/2 -translate-x-1/2">
      <TimerWidget compact />
    </div>

    <!-- С рамкой вебки (справа под шапкой) музыка живёт слева над чатом: карточка кончается на ~190 px,
         чат начинается с 211 px. Без рамки она справа под шапкой, как раньше -->
    <div v-if="webcam && widgets.on('music')" class="absolute top-2 left-0">
      <MusicWidget />
    </div>

    <div v-if="widgets.on('chat')" class="absolute bottom-36 left-0 w-100">
      <ChatWidget :messages="chat.messages" />
    </div>

    <header class="flex w-full justify-end">
      <div v-if="widgets.on('header')" class="flex items-center gap-x-2 pt-2 pr-3">
        <RouletteTicker />
        <StreamXpWidget />
      </div>
    </header>

    <div v-if="!webcam && widgets.on('music')" class="absolute top-18.5 right-3">
      <MusicWidget />
    </div>

    <!-- Чип буста стоит под шапкой; при рамке вебки уходит левее неё (12 + 400 + 12 px) -->
    <StreamXpBoost v-if="widgets.on('header')" :right="webcam ? 'right-106' : 'right-86'" />

    <!-- Правый верхний угол под шапкой, 400 px: окно 16:9 с рамкой -->
    <div v-if="webcam" class="absolute top-18.5 right-3 w-100">
      <WebcamFrame />
    </div>

    <RouletteWidget v-if="widgets.on('roulette')" />
    <LotteryWidget v-if="widgets.on('lottery')" />
    <ProfileWidget v-if="widgets.on('profile')" />
    <LeaderboardWidget v-if="widgets.on('leaderboard')" />
    <ShopWidget v-if="widgets.on('shop')" />
    <TowerWidget v-if="widgets.on('tower')" />

    <div v-if="widgets.on('alerts')" class="absolute bottom-48 left-1/2 -translate-x-1/2">
      <AlertWidget />
    </div>
  </div>
</template>
