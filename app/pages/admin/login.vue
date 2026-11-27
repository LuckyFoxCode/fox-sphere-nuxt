<script setup lang="ts">
definePageMeta({ layout: 'admin-login' });

// Причины отказа приходят из /auth/twitch/callback кодом, а не текстом: чужая ссылка не подставит свой
const ERRORS: Record<string, string> = {
  account: 'Это не аккаунт стримера. Выйдите из него в Twitch (или откройте окно инкогнито) и войдите нужным.',
  denied: 'Вход в Twitch отменён.',
  state: 'Вход не завершён. Откройте админку по адресу localhost, как в TWITCH_BOT_REDIRECT_URI, и попробуйте ещё раз.',
  twitch: 'Twitch не подтвердил вход. Проверьте TWITCH_CLIENT_ID и TWITCH_CLIENT_SECRET и попробуйте ещё раз.',
  setup:
    'Вход не настроен. В .env нужны ADMIN_SESSION_SECRET (не короче 32 символов), TWITCH_USER_ID, TWITCH_CLIENT_ID, TWITCH_CLIENT_SECRET и TWITCH_BOT_REDIRECT_URI. После правки перезапустите сайт.',
};
const route = useRoute();
const error = computed(() => ERRORS[String(route.query.error ?? '')]);

// Уже вошли — сразу в пульт
onMounted(async () => {
  try {
    await $fetch('/api/admin/session');
    await navigateTo('/admin');
  } catch {
    // не вошли: остаёмся здесь
  }
});
</script>

<template>
  <UCard class="w-full max-w-md">
    <template #header>
      <h1 class="text-xl font-bold text-highlighted">Админка fox-sphere</h1>
      <p class="mt-1 text-sm text-muted">Вход только для стримера.</p>
    </template>

    <div class="flex flex-col gap-4">
      <UAlert v-if="error" color="error" variant="subtle" icon="i-lucide-triangle-alert" :description="error" />
      <UButton to="/auth/twitch/admin/login" external size="xl" block icon="i-lucide-log-in">
        Войти через Twitch
      </UButton>
    </div>
  </UCard>
</template>
