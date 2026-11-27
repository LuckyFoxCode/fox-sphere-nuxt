<script setup lang="ts">
// Каркас админки: боковое меню разделов и страница справа. Новый раздел — пункт в `sections`.
import { ru } from '@nuxt/ui/locale';
import '~/assets/css/admin.css';

// Тема всегда тёмная (colorMode в Nuxt UI выключен)
useHead({ htmlAttrs: { class: 'dark', lang: 'ru' }, title: 'Админка · fox-sphere' });

const sections = [
  { label: 'Пульт эфира', icon: 'i-lucide-radio', to: '/admin', exact: true },
  { label: 'Команды', icon: 'i-lucide-terminal', to: '/admin/commands' },
  { label: 'Зрители', icon: 'i-lucide-users', to: '/admin/viewers' },
  { label: 'Настройки', icon: 'i-lucide-settings', to: '/admin/settings' },
];
// Обычные переходы с перезагрузкой: стили админки не должны ехать на другие страницы
const links = [{ label: 'Оверлеи', icon: 'i-lucide-layers', to: '/', external: true }];

const login = useAdminLogin();
const { act } = useAdminApi();
const logout = async () => {
  if (await act('/api/admin/logout', undefined, 'Вы вышли')) await navigateTo('/admin/login');
};
</script>

<template>
  <UApp :locale="ru">
    <UDashboardGroup>
      <UDashboardSidebar class="min-w-56">
        <template #header>
          <span class="text-lg font-bold text-highlighted">fox-sphere</span>
        </template>

        <UNavigationMenu :items="sections" orientation="vertical" />
        <UNavigationMenu :items="links" orientation="vertical" class="mt-auto" />

        <template #footer>
          <div class="flex w-full items-center justify-between gap-2">
            <span class="truncate text-sm text-muted">{{ login }}</span>
            <UButton color="neutral" variant="ghost" icon="i-lucide-log-out" @click="logout">Выйти</UButton>
          </div>
        </template>
      </UDashboardSidebar>

      <slot />
    </UDashboardGroup>
  </UApp>
</template>
