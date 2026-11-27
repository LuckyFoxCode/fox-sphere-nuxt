<script setup lang="ts">
// Подключения: отвечает ли бот, в чате ли он, и сохранены ли входы Twitch. Сами токены сюда не приходят.
import type { AdminStreamState } from '#shared/admin';
import type { AdminAccount } from '#shared/settings';

const props = defineProps<{
  accounts: AdminAccount[];
  // null — состояние ещё не получено или бот не отвечает
  state: AdminStreamState | null;
  problem: string;
}>();

const bot = computed(() => {
  if (props.problem) return { color: 'error', icon: 'i-lucide-unplug', text: props.problem } as const;
  if (!props.state) return { color: 'neutral', icon: 'i-lucide-loader', text: 'Проверяем…' } as const;
  if (!props.state.botEnabled) {
    return { color: 'warning', icon: 'i-lucide-power-off', text: 'Выключен (BOT_ENABLED)' } as const;
  }
  return props.state.chatConnected
    ? ({ color: 'success', icon: 'i-lucide-check', text: 'Работает и подключён к чату' } as const)
    : ({ color: 'warning', icon: 'i-lucide-loader', text: 'Работает, к чату ещё не подключён' } as const);
});

const ROLES: Record<AdminAccount['role'], { title: string; path: string }> = {
  bot: { title: 'Аккаунт бота', path: '/auth/twitch/login' },
  broadcaster: { title: 'Аккаунт стримера', path: '/auth/twitch/broadcaster/login' },
  both: { title: 'Бот и стример (один аккаунт)', path: '/auth/twitch/login' },
};
</script>

<template>
  <UCard>
    <template #header>
      <h2 class="text-lg font-semibold text-highlighted">Подключения</h2>
    </template>

    <ul class="divide-y divide-default">
      <li class="flex flex-wrap items-center justify-between gap-2 pb-3">
        <span class="font-semibold text-highlighted">Бот</span>
        <UBadge :color="bot.color" :icon="bot.icon" variant="subtle" size="lg">{{ bot.text }}</UBadge>
      </li>
      <li v-for="account in accounts" :key="account.role" class="flex flex-wrap items-center gap-3 py-3">
        <div class="min-w-0 flex-1">
          <div class="font-semibold text-highlighted">{{ ROLES[account.role].title }}</div>
          <div class="text-sm text-muted">
            {{ account.authorized ? `Токен сохранён: ${formatDate(account.updatedAt)}` : 'Входа ещё не было' }}
          </div>
        </div>
        <UBadge
          :color="account.authorized ? 'success' : 'error'"
          :icon="account.authorized ? 'i-lucide-check' : 'i-lucide-x'"
          variant="subtle"
          size="lg"
        >
          {{ account.authorized ? 'вход выполнен' : 'нет входа' }}
        </UBadge>
        <!-- Новая вкладка: вход заканчивается страницей Twitch, админка должна остаться открытой -->
        <UButton
          :to="ROLES[account.role].path"
          external
          target="_blank"
          color="neutral"
          variant="subtle"
          icon="i-lucide-log-in"
        >
          {{ account.authorized ? 'Войти заново' : 'Войти' }}
        </UButton>
      </li>
    </ul>

    <p class="mt-3 text-sm text-muted">
      Дата обновляется сама, пока бот продлевает токен. Twitch спросит, каким аккаунтом входить: выберите нужный. После
      повторного входа перезапустите бота.
    </p>
  </UCard>
</template>
