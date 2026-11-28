<script setup lang="ts">
// Карточка игры на странице «Игры»: что это и зачем, команды чата и ссылки. Слот по умолчанию виден
// всегда, слот `details` свёрнут, чтобы страница оставалась короткой.
import { CODE_COMMANDS, type CodeCommandName } from '#shared/commands';

defineProps<{
  title: string;
  icon: string;
  summary: string;
  /** id из shared/features.ts для ярлыков */
  feature?: string;
  commands?: readonly CodeCommandName[];
  /** Префикс команд; пока не загружен, команды не показываются */
  prefix: string;
  links?: readonly { label: string; to: string; icon: string }[];
}>();

const open = ref(false);
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-start gap-3">
        <div class="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <UIcon :name="icon" class="size-5" />
        </div>
        <div class="min-w-0">
          <h2 class="flex flex-wrap items-center gap-2 text-lg font-semibold text-highlighted">
            {{ title }}
            <AdminFeatureBadges v-if="feature" :id="feature" />
          </h2>
          <p class="text-sm text-muted">{{ summary }}</p>
        </div>
      </div>
    </template>

    <div class="flex flex-col gap-4">
      <slot />

      <div v-if="prefix && commands?.length" class="flex flex-wrap gap-2">
        <UBadge
          v-for="name in commands"
          :key="name"
          color="neutral"
          variant="outline"
          class="font-mono"
          :title="CODE_COMMANDS[name].description"
        >
          {{ prefix }}{{ name }}
        </UBadge>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <UButton
          color="neutral"
          variant="subtle"
          :trailing-icon="open ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
          :aria-expanded="open"
          @click="open = !open"
        >
          {{ open ? 'Свернуть' : 'Подробнее' }}
        </UButton>
        <UButton v-for="link in links" :key="link.to" :to="link.to" :icon="link.icon" color="neutral" variant="ghost">
          {{ link.label }}
        </UButton>
      </div>

      <UCollapsible :open="open">
        <template #content>
          <div class="flex flex-col gap-4 border-t border-default pt-4">
            <slot name="details" />
          </div>
        </template>
      </UCollapsible>
    </div>
  </UCard>
</template>
