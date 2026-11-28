<script setup lang="ts">
// Каркас админки: боковое меню разделов и страница справа. Новый раздел — пункт в `sections`.
import { ru } from '@nuxt/ui/locale';
import '~/assets/css/admin.css';

// Тема всегда тёмная (colorMode в Nuxt UI выключен). Панель занимает весь экран и прокручивается внутри,
// поэтому у самой страницы прокрутки нет (иначе в dev её добавляет элемент Nuxt DevTools)
useHead({
  htmlAttrs: { class: 'dark', lang: 'ru' },
  bodyAttrs: { class: 'overflow-hidden' },
  title: 'Админка · fox-sphere',
});

const sections = [
  { label: 'Пульт эфира', icon: 'i-lucide-radio', to: '/admin', exact: true },
  { label: 'Команды', icon: 'i-lucide-terminal', to: '/admin/commands' },
  { label: 'Зрители', icon: 'i-lucide-users', to: '/admin/viewers' },
  { label: 'События', icon: 'i-lucide-party-popper', to: '/admin/events' },
  { label: 'Настройки', icon: 'i-lucide-settings', to: '/admin/settings' },
];
// Обычные переходы с перезагрузкой: стили админки не должны ехать на другие страницы
const links = [{ label: 'Оверлеи', icon: 'i-lucide-layers', to: '/', external: true }];

useAdminPalette().apply();

const version = useAppVersion();
const login = useAdminLogin();
const { act } = useAdminApi();
const logout = async () => {
  if (await act('/api/admin/logout', undefined, 'Вы вышли')) await navigateTo('/admin/login');
};
</script>

<template>
  <UApp :locale="ru">
    <!-- Размеры в rem: развёрнутое меню 14, свёрнутая полоска с иконками 4.5. Состояние запоминается в cookie -->
    <UDashboardGroup unit="rem">
      <UDashboardSidebar collapsible :default-size="14" :collapsed-size="4.5">
        <template #header="{ collapsed }">
          <span v-if="!collapsed" class="text-lg font-bold text-highlighted">fox-sphere</span>
          <UDashboardSidebarCollapse :class="collapsed ? 'mx-auto' : 'ms-auto'" />
        </template>

        <template #default="{ collapsed }">
          <UNavigationMenu :items="sections" :collapsed="collapsed" orientation="vertical" tooltip />
          <UNavigationMenu :items="links" :collapsed="collapsed" orientation="vertical" tooltip class="mt-auto" />
        </template>

        <template #footer="{ collapsed }">
          <div class="flex w-full flex-col gap-2">
            <div v-if="!collapsed" class="flex w-full items-center justify-between gap-2">
              <span class="truncate text-sm text-muted">{{ login }}</span>
              <UButton color="neutral" variant="ghost" icon="i-lucide-log-out" @click="logout">Выйти</UButton>
            </div>
            <UButton v-else color="neutral" variant="ghost" icon="i-lucide-log-out" class="mx-auto" aria-label="Выйти" @click="logout" />
            <span class="text-center text-xs text-dimmed">{{ collapsed ? `v${version}` : `Версия ${version}` }}</span>
          </div>
        </template>
      </UDashboardSidebar>

      <slot />
    </UDashboardGroup>
  </UApp>
</template>
