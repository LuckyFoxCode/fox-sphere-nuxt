<script setup lang="ts">
// Страница раздела: заголовок (на узком экране с кнопкой меню) и содержимое.
// Слот `title` заменяет текст заголовка, например на хлебные крошки; `feature` — id из shared/features.ts для ярлыков
defineProps<{ title: string; feature?: string }>();
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar :title="title">
        <template #title>
          <slot name="title">
            <span class="flex items-center gap-2">
              {{ title }}
              <AdminFeatureBadges v-if="feature" :id="feature" />
            </span>
          </slot>
        </template>
      </UDashboardNavbar>
    </template>
    <template #body>
      <!-- shrink-0: иначе колонка прокрутки сжимает плашки по высоте -->
      <div class="flex shrink-0 flex-col gap-4">
        <slot />
      </div>
    </template>
  </UDashboardPanel>
</template>
