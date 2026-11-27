<script setup lang="ts">
// Страница раздела: заголовок (на узком экране с кнопкой меню) и содержимое
defineProps<{ title: string }>();
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar :title="title" />
    </template>
    <template #body>
      <!-- shrink-0: иначе колонка прокрутки сжимает плашки по высоте -->
      <div class="flex shrink-0 flex-col gap-4">
        <slot />
      </div>
    </template>
  </UDashboardPanel>
</template>
