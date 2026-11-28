<script setup lang="ts">
// Пульт эфира: буст XP, таймер, VIP-лотерея, тестовые алерты и карточки. Состояние бота обновляется раз в 3 с.
import type { AdminStreamState } from '#shared/admin';

definePageMeta({ layout: 'admin', middleware: 'admin' });

const { leaveIfSignedOut } = useAdminApi();
const state = ref<AdminStreamState | null>(null);
const problem = ref('');

let timer: ReturnType<typeof setTimeout> | undefined;
let alive = true;
// Номер последнего запроса: опоздавший ответ не должен затереть более свежий
let latest = 0;

const refresh = async () => {
  clearTimeout(timer);
  const request = ++latest;
  try {
    const next = await $fetch<AdminStreamState>('/api/admin/stream/state');
    if (request !== latest) return;
    state.value = next;
    problem.value = '';
  } catch (error) {
    if (request !== latest || (await leaveIfSignedOut(error))) return;
    state.value = null;
    problem.value = adminErrorText(error);
  }
  if (alive) timer = setTimeout(refresh, 3000);
};

onMounted(refresh);
onBeforeUnmount(() => {
  alive = false;
  clearTimeout(timer);
});
</script>

<template>
  <AdminPage title="Пульт эфира">
    <UAlert
      v-if="problem"
      color="error"
      variant="subtle"
      icon="i-lucide-unplug"
      title="Нет связи с ботом"
      :description="problem"
    />
    <UAlert
      v-else-if="state && !state.botEnabled"
      color="warning"
      variant="subtle"
      icon="i-lucide-power-off"
      title="Бот выключен (BOT_ENABLED)"
      description="Буст и тестовые показы работают, розыгрыш лотереи — нет."
    />

    <div class="grid items-start gap-4 xl:grid-cols-2">
      <div class="flex flex-col gap-4">
        <AdminBoostCard :state="state" @changed="refresh" />
        <AdminTimerCard :state="state" @changed="refresh" />
        <AdminTestCard :disabled="!state" />
      </div>
      <AdminLotteryCard :state="state" @changed="refresh" />
    </div>
  </AdminPage>
</template>
