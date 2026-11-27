<script setup lang="ts">
// Строка команды: имя плашкой, алиасы и кто может вызвать. Справа — слот для управления.
import { COMMAND_ROLES, type CommandRole } from '#shared/commands';

defineProps<{ name: string; aliases: readonly string[]; prefix: string; role: CommandRole }>();

const ROLE_STYLE = {
  viewer: { color: 'neutral', icon: 'i-lucide-users' },
  moderator: { color: 'info', icon: 'i-lucide-shield' },
  broadcaster: { color: 'warning', icon: 'i-lucide-crown' },
} as const;
</script>

<template>
  <div class="flex flex-wrap items-center gap-2">
    <UBadge color="primary" size="lg" class="font-mono font-bold">{{ prefix }}{{ name }}</UBadge>
    <UBadge :color="ROLE_STYLE[role].color" :icon="ROLE_STYLE[role].icon" variant="subtle">
      {{ COMMAND_ROLES[role] }}
    </UBadge>
    <UBadge v-for="alias in aliases" :key="alias" color="neutral" variant="outline" class="font-mono">
      {{ prefix }}{{ alias }}
    </UBadge>
    <div class="ml-auto flex items-center gap-3">
      <slot />
    </div>
  </div>
</template>
