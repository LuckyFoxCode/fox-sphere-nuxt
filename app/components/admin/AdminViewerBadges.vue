<script setup lang="ts">
// Метки зрителя: роли, VIP и билет лотереи. Названия английские, как в Twitch. Цвет neutral не берём:
// метка сливалась бы с белым ником.
import type { AdminViewer } from '#shared/viewers';

const props = defineProps<{ viewer: AdminViewer }>();

const badges = computed(() => {
  const viewer = props.viewer;
  return (
    [
      [viewer.isStreamer, 'streamer', 'error', 'subtle', 'i-lucide-crown'],
      [viewer.isBot, 'bot', 'success', 'outline', 'i-lucide-bot'],
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
    >
      {{ label }}
    </UBadge>
  </span>
</template>
