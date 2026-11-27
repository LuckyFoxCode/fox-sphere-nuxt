<script setup lang="ts">
// Настройки: язык бота, цвета админки и подключения. Состояние бота и входы обновляются раз в 5 с.
import type { AdminStreamState } from '#shared/admin';
import type { AdminSettings } from '#shared/settings';

definePageMeta({ layout: 'admin', middleware: 'admin' });

const { leaveIfSignedOut } = useAdminApi();
const settings = ref<AdminSettings | null>(null);
const problem = ref('');
const state = ref<AdminStreamState | null>(null);
const botProblem = ref('');

const loadSettings = async () => {
  try {
    settings.value = await $fetch<AdminSettings>('/api/admin/settings');
    problem.value = '';
  } catch (error) {
    if (!(await leaveIfSignedOut(error))) problem.value = adminErrorText(error);
  }
};

// Бот может не отвечать: это не мешает остальным настройкам
const loadState = async () => {
  try {
    state.value = await $fetch<AdminStreamState>('/api/admin/stream/state');
    botProblem.value = '';
  } catch (error) {
    if (await leaveIfSignedOut(error)) return;
    state.value = null;
    botProblem.value = adminErrorText(error);
  }
};

let timer: ReturnType<typeof setTimeout> | undefined;
let alive = true;
const refresh = async () => {
  await Promise.all([loadSettings(), loadState()]);
  if (alive) timer = setTimeout(refresh, 5000);
};
onMounted(refresh);
onBeforeUnmount(() => {
  alive = false;
  clearTimeout(timer);
});
</script>

<template>
  <AdminPage title="Настройки">
    <UAlert
      v-if="problem"
      color="error"
      variant="subtle"
      icon="i-lucide-unplug"
      title="Не удалось загрузить настройки"
      :description="problem"
    />

    <div class="grid items-start gap-4 xl:grid-cols-2">
      <div class="flex flex-col gap-4">
        <AdminLanguageCard :current="settings?.botLang ?? null" @changed="loadSettings" />
        <AdminPaletteCard />
      </div>
      <AdminConnectionsCard :accounts="settings?.accounts ?? []" :state="state" :problem="botProblem" />
    </div>
  </AdminPage>
</template>
