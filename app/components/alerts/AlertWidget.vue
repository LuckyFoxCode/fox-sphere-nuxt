<script setup lang="ts">
// Показывает текущий алерт из очереди и играет его звук.
// Звук живёт здесь, а не в сторе: он нужен только там, где алерт виден.
import type { Component } from 'vue';
import IconGift from '~/components/icons/IconGift.vue';
import IconLightning from '~/components/icons/IconLightning.vue';
import IconPaw from '~/components/icons/IconPaw.vue';
import IconStar from '~/components/icons/IconStar.vue';
import type { AlertKind } from '~/utils/alerts';

// Громкость из старого fox-sphere; точнее настраивается в микшере OBS
const VOLUME = 0.5;

const ICONS: Record<AlertKind, Component> = {
  follow: IconPaw,
  raid: IconLightning,
  reward: IconGift,
  sub: IconStar,
};

const alerts = useAlertsStore();

watch(
  () => alerts.current,
  (alert) => {
    if (!alert?.sound) return;
    const audio = new Audio(alert.sound);
    audio.volume = VOLUME;
    // Обычный браузер не даёт играть звук без клика по странице; в OBS ограничения нет
    audio.play().catch((error) => console.warn(`звук алерта не проигран: ${alert.sound}`, error));
  },
  { immediate: true },
);
</script>

<template>
  <Transition name="sticker-slap" mode="out-in">
    <EventSticker
      v-if="alerts.current"
      :key="alerts.current.id"
      :paper="alerts.current.paper"
      :icon="ICONS[alerts.current.kind]"
      :label="alerts.current.label"
      :title="alerts.current.title"
      :detail="alerts.current.detail"
      :stat="alerts.current.stat"
      :chips="alerts.current.chips"
    />
  </Transition>
</template>
