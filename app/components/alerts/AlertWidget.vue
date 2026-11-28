<script setup lang="ts">
// Показывает текущий алерт из очереди и играет его звук.
// Звук живёт здесь, а не в сторе: он нужен только там, где алерт виден.
import type { Component } from "vue";
import IconCoin from "~/components/icons/IconCoin.vue";
import IconCrown from "~/components/icons/IconCrown.vue";
import IconGift from "~/components/icons/IconGift.vue";
import IconLightning from "~/components/icons/IconLightning.vue";
import IconPaw from "~/components/icons/IconPaw.vue";
import IconStar from "~/components/icons/IconStar.vue";
import IconTicket from "~/components/icons/IconTicket.vue";
import type { AlertKind } from "~/utils/alerts";

// Громкость из старого fox-sphere; точнее настраивается в микшере OBS
const VOLUME = 0.5;

// У сундука своя наклейка (ChestAlert), у пива и стрика вместо значка арт
const ICONS: Record<Exclude<AlertKind, "chest" | "beer" | "streak" | "levelup" | "herolevelup">, Component> = {
  follow: IconPaw,
  raid: IconLightning,
  reward: IconGift,
  sub: IconStar,
  vip: IconCrown,
  ticket: IconTicket,
  bits: IconCoin,
};

const alerts = useAlertsStore();

watch(
  () => alerts.current,
  (alert) => {
    if (!alert?.sound) return;
    const audio = new Audio(alert.sound);
    audio.volume = VOLUME;
    // Обычный браузер не даёт играть звук без клика по странице; в OBS ограничения нет
    const play = () =>
      audio
        .play()
        .catch((error) =>
          console.warn(`звук алерта не проигран: ${alert.sound}`, error),
        );
    if (alert.soundDelayMs) setTimeout(play, alert.soundDelayMs);
    else play();
  },
  { immediate: true },
);
</script>

<template>
  <Transition name="sticker-slap" mode="out-in">
    <ChestAlert
      v-if="alerts.current?.kind === 'chest'"
      :key="`chest-${alerts.current.id}`"
      :label="alerts.current.label"
      :username="alerts.current.title"
      :amount="alerts.current.detail ?? ''"
    />
    <LevelUpCard
      v-else-if="alerts.current?.kind === 'levelup' && alerts.current.levelUp"
      :key="`levelup-${alerts.current.id}`"
      :payload="alerts.current.levelUp"
    />
    <HeroLevelUpCard
      v-else-if="alerts.current?.kind === 'herolevelup' && alerts.current.heroLevelUp"
      :key="`herolevelup-${alerts.current.id}`"
      :payload="alerts.current.heroLevelUp"
    />
    <EventSticker
      v-else-if="alerts.current"
      :key="`sticker-${alerts.current.id}`"
      :paper="alerts.current.paper"
      :motion="alerts.current.kind"
      :icon="
        alerts.current.kind === 'beer' ||
        alerts.current.kind === 'streak' ||
        alerts.current.kind === 'levelup' ||
        alerts.current.kind === 'herolevelup'
          ? undefined
          : ICONS[alerts.current.kind]
      "
      :media="alerts.current.media"
      :tag="alerts.current.tag"
      :label="alerts.current.label"
      :title="alerts.current.title"
      :detail="alerts.current.detail"
      :stat="alerts.current.stat"
      :chips="alerts.current.chips"
    />
  </Transition>
</template>
