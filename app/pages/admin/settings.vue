<script setup lang="ts">
// Настройки по вкладкам: сцена (виджеты, бонус башни), бот (язык, подключения), панель и данные (цвета, копия базы). Состояние бота и входы обновляются раз в 5 с.
import type { AdminStreamState } from '#shared/admin';
import type { AdminSettings } from '#shared/settings';
import type { WidgetStates } from '#shared/widgets';

definePageMeta({ layout: 'admin', middleware: 'admin' });

const { leaveIfSignedOut } = useAdminApi();
const settings = ref<AdminSettings | null>(null);
const widgets = ref<WidgetStates | null>(null);
const problem = ref('');
const state = ref<AdminStreamState | null>(null);
const botProblem = ref('');

// Вкладки по темам; выбранная запоминается в cookie
const tabs = [
  { label: 'Сцена', icon: 'i-lucide-layers', value: 'scene' },
  { label: 'Бот', icon: 'i-lucide-bot', value: 'bot' },
  { label: 'Панель и данные', icon: 'i-lucide-sliders-horizontal', value: 'panel' },
];
const savedTab = useCookie<string>('admin-settings-tab', { default: () => 'scene', maxAge: 31536000 });
const tab = computed({
  get: () => (tabs.some((item) => item.value === savedTab.value) ? savedTab.value : 'scene'),
  set: (value: string) => (savedTab.value = value),
});

const loadSettings = async () => {
  try {
    [settings.value, widgets.value] = await Promise.all([
      $fetch<AdminSettings>('/api/admin/settings'),
      $fetch<WidgetStates>('/api/widgets'),
    ]);
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

    <UTabs v-model="tab" :items="tabs" :content="false" class="w-full" />

    <div v-if="tab === 'scene'" class="grid items-start gap-4 lg:grid-cols-2">
      <AdminWidgetsCard :states="widgets" @changed="loadSettings" />
      <AdminTowerBonusCard />
    </div>
    <div v-else-if="tab === 'bot'" class="grid items-start gap-4 lg:grid-cols-2">
      <AdminLanguageCard :current="settings?.botLang ?? null" @changed="loadSettings" />
      <AdminConnectionsCard :accounts="settings?.accounts ?? []" :state="state" :problem="botProblem" />
    </div>
    <div v-else class="grid items-start gap-4 lg:grid-cols-2">
      <AdminPaletteCard />
      <AdminBackupCard />
    </div>
  </AdminPage>
</template>
