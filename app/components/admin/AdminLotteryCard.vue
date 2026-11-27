<script setup lang="ts">
// VIP-лотерея: билеты, победители прошлого розыгрыша и запуск с подтверждением (то же, что !runlottery).
import type { AdminStreamState } from '#shared/admin';
import { LOTTERY_CONFIG } from '#shared/lottery';

const props = defineProps<{ state: AdminStreamState | null }>();
const emit = defineEmits<{ changed: [] }>();

const { act } = useAdminApi();
const confirmOpen = ref(false);
const busy = ref(false);

const lottery = computed(() => props.state?.lottery);
const rows = computed(() =>
  (lottery.value?.tickets ?? []).map((username, index) => ({ number: index + 1, username })),
);
const columns = [
  { accessorKey: 'number', header: '№' },
  { accessorKey: 'username', header: 'Держатель билета' },
];

// Почему кнопка розыгрыша выключена; пусто — можно запускать
const blocked = computed(() => {
  if (!props.state) return 'Нет связи с ботом.';
  if (!props.state.botEnabled) return 'Бот выключен.';
  if (!props.state.chatConnected) return 'Бот ещё не подключён к чату.';
  if (props.state.lottery.running) return 'Розыгрыш идёт. Победители появятся здесь после сцены на оверлее.';
  return '';
});

const run = async () => {
  busy.value = true;
  await act('/api/admin/stream/lottery', { confirm: true }, 'Розыгрыш запущен');
  busy.value = false;
  confirmOpen.value = false;
  emit('changed');
};
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex flex-wrap items-center justify-between gap-2">
        <h2 class="text-lg font-semibold text-highlighted">VIP-лотерея</h2>
        <UBadge color="neutral" variant="subtle" size="lg">билетов: {{ lottery ? rows.length : '—' }}</UBadge>
      </div>
    </template>

    <div class="flex flex-col gap-4">
      <div>
        <h3 class="text-sm font-semibold text-muted">Победители прошлого розыгрыша</h3>
        <div v-if="lottery?.winners?.length" class="mt-2 flex flex-wrap gap-2">
          <UBadge v-for="name in lottery.winners" :key="name" size="lg" variant="subtle" icon="i-lucide-crown">
            {{ name }}
          </UBadge>
        </div>
        <p v-else class="mt-2 text-sm text-muted">
          {{ lottery?.running ? 'Идёт розыгрыш…' : lottery ? 'Пока нет.' : '—' }}
        </p>
      </div>

      <UTable
        :data="rows"
        :columns="columns"
        empty="Билетов ни у кого нет"
        sticky
        class="max-h-80 rounded-md border border-default"
      />

      <div class="flex flex-col gap-2">
        <UButton
          size="xl"
          color="warning"
          icon="i-lucide-dices"
          class="self-start"
          :disabled="Boolean(blocked)"
          @click="confirmOpen = true"
        >
          Провести розыгрыш
        </UButton>
        <p v-if="blocked" class="text-sm text-muted">{{ blocked }}</p>
      </div>
    </div>

    <UModal v-model:open="confirmOpen" title="Провести розыгрыш?" description="Отменить это будет нельзя.">
      <template #body>
        <ul class="list-disc space-y-2 pl-5 text-sm">
          <li v-if="rows.length">
            Бот выберет до {{ LOTTERY_CONFIG.WINNERS_COUNT }} победителей, участников с билетами: {{ rows.length }}.
          </li>
          <li v-else class="font-semibold text-warning">Билетов нет: новых победителей не будет.</li>
          <li>Прошлые победители теряют временный VIP, билеты и недельный XP обнуляются у всех.</li>
          <li>Сцена розыгрыша появится на стриме, бот напишет в чат.</li>
          <li v-if="state?.lottery.twitchVip">VIP на Twitch будет снят и выдан по-настоящему.</li>
          <li v-else>VIP на самом Twitch не изменится (LOTTERY_TWITCH_VIP), изменится только база.</li>
        </ul>
      </template>
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton size="lg" color="neutral" variant="subtle" :disabled="busy" @click="confirmOpen = false">
            Отмена
          </UButton>
          <UButton size="lg" color="error" :loading="busy" :disabled="Boolean(blocked)" @click="run">
            Да, провести
          </UButton>
        </div>
      </template>
    </UModal>
  </UCard>
</template>
