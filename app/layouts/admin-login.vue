<script setup lang="ts">
import { ru } from '@nuxt/ui/locale';
import '~/assets/css/admin.css';

useHead({ htmlAttrs: { class: 'dark', lang: 'ru' }, title: 'Вход · fox-sphere' });
</script>

<template>
  <UApp :locale="ru">
    <main class="flex min-h-screen items-center justify-center p-4">
      <slot />
    </main>
  </UApp>
</template>
