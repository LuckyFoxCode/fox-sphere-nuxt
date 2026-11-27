<script setup lang="ts">
// Метки зрителя: фолловер или просто зритель, роли, VIP и билет лотереи. Названия английские, как в
// Twitch. Белый цвет neutral не берём: метка сливалась бы с ником; `viewer` приглушён до серого.
import type { AdminViewer } from '#shared/viewers';

const props = defineProps<{ viewer: AdminViewer }>();

const badges = computed(() => {
  const viewer = props.viewer;
  // Стример и бот — не зрители
  const person = !viewer.isStreamer && !viewer.isBot;
  return (
    [
      [viewer.isStreamer, 'streamer', 'error', 'subtle', 'i-lucide-crown'],
      [viewer.isBot, 'bot', 'success', 'outline', 'i-lucide-bot'],
      // Одна из двух: фолловит или просто зритель. Статус неизвестен — ни одной
      [person && viewer.isFollower === true, 'follower', 'info', 'outline', 'i-lucide-heart'],
      [person && viewer.isFollower === false, 'viewer', 'neutral', 'outline', 'i-lucide-eye'],
      [viewer.isMod, 'mod', 'success', 'subtle', 'i-lucide-shield'],
      [viewer.isSubscriber, 'sub', 'info', 'subtle', 'i-lucide-star'],
      [viewer.isFounder, 'founder', 'warning', 'subtle', 'i-lucide-medal'],
      [viewer.isPermanentVip, 'VIP', 'secondary', 'subtle', 'i-lucide-gem'],
      [viewer.isLuckyVip, 'lottery VIP', 'secondary', 'outline', 'i-lucide-dices'],
      [viewer.hasTicket, 'ticket', 'primary', 'outline', 'i-lucide-ticket'],
    ] as const
  ).filter(([shown]) => shown);
});
</script>

<template>
  <span v-if="badges.length" class="inline-flex flex-wrap gap-1">
    <UBadge
      v-for="[, label, color, variant, icon] in badges"
      :key="label"
      :color="color"
      :variant="variant"
      :icon="icon"
      :class="label === 'viewer' && 'text-dimmed'"
    >
      {{ label }}
    </UBadge>
  </span>
</template>
