<script setup lang="ts">
// Резервная копия базы: кнопка и список уже сделанных. Файлы остаются на этом компьютере.
import type { AdminBackups } from '#shared/settings';

const SHOWN = 5;

const { act, leaveIfSignedOut } = useAdminApi();
const backups = ref<AdminBackups | null>(null);
const problem = ref('');
const busy = ref(false);

const load = async () => {
  try {
    backups.value = await $fetch<AdminBackups>('/api/admin/backup');
    problem.value = '';
  } catch (error) {
    if (!(await leaveIfSignedOut(error))) problem.value = adminErrorText(error);
  }
};
onMounted(load);

const create = async () => {
  busy.value = true;
  if (await act('/api/admin/backup', undefined, 'Копия базы сделана')) await load();
  busy.value = false;
};

const items = computed(() => backups.value?.items ?? []);
const size = (bytes: number) =>
  bytes < 1024 * 1024 ? `${Math.ceil(bytes / 1024)} КБ` : `${(bytes / 1024 / 1024).toFixed(1)} МБ`;
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex flex-wrap items-center justify-between gap-2">
        <h2 class="text-lg font-semibold text-highlighted">Копия базы</h2>
        <UBadge color="neutral" variant="subtle" size="lg">копий: {{ backups ? items.length : '—' }}</UBadge>
      </div>
    </template>

    <div class="flex flex-col gap-4">
      <UAlert v-if="problem" color="error" variant="subtle" icon="i-lucide-triangle-alert" :title="problem" />

      <UButton size="xl" icon="i-lucide-database-backup" class="self-start" :loading="busy" @click="create">
        Сделать копию
      </UButton>

      <ul v-if="items.length" class="divide-y divide-default rounded-md border border-default">
        <li v-for="item in items.slice(0, SHOWN)" :key="item.name" class="flex items-center gap-3 p-2">
          <UIcon name="i-lucide-file-archive" class="size-5 shrink-0 text-muted" />
          <div class="min-w-0 flex-1">
            <div class="text-sm font-semibold text-highlighted">{{ formatDate(item.createdAt) }}</div>
            <div class="truncate font-mono text-xs text-dimmed" :title="item.name">{{ item.name }}</div>
          </div>
          <span class="shrink-0 text-sm text-muted tabular-nums">{{ size(item.size) }}</span>
        </li>
      </ul>
      <p v-else-if="backups" class="text-sm text-muted">Копий пока нет.</p>
      <p v-if="items.length > SHOWN" class="text-xs text-dimmed">Показаны последние {{ SHOWN }}.</p>

      <p v-if="backups" class="text-sm text-muted">
        Копируется база <code>{{ backups.database }}</code> целиком, бота останавливать не нужно. Файлы лежат в
        <code class="break-all">{{ backups.folder }}</code
        >, сами не удаляются. Внутри есть входы Twitch: никому их не отправляйте.
      </p>
    </div>
  </UCard>
</template>
