<script setup lang="ts">
// Цвета админки: готовые наборы, применяются сразу. Выбор живёт в этом браузере.
import { ADMIN_PALETTES } from '~/utils/adminPalettes';

const { current, choose } = useAdminPalette();
</script>

<template>
  <UCard>
    <template #header>
      <h2 class="text-lg font-semibold text-highlighted">Цвета админки</h2>
    </template>

    <div class="flex flex-col gap-4">
      <div class="flex flex-wrap gap-2" role="group" aria-label="Набор цветов">
        <UButton
          v-for="palette in ADMIN_PALETTES"
          :key="palette.id"
          size="lg"
          color="neutral"
          :variant="current === palette.id ? 'outline' : 'subtle'"
          :class="current === palette.id && 'ring-2 ring-primary'"
          :aria-pressed="current === palette.id"
          @click="choose(palette.id)"
        >
          <span class="size-4 rounded-full" :style="{ background: palette.swatch }" />
          {{ palette.label }}
        </UButton>
      </div>
      <p class="text-sm text-muted">
        Меняются акцент и фон. Выбор запоминается в этом браузере, на оверлеи он не влияет.
      </p>
    </div>
  </UCard>
</template>
