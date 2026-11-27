<script setup lang="ts">
// Зрители и балансы: поиск по нику и сортировка; ник открывает страницу зрителя. Ничего не меняет.
import type { AdminViewer } from '#shared/viewers';
import { getRankConfigByLevel } from '~/utils/chat/ranks';

definePageMeta({ layout: 'admin', middleware: 'admin' });

const PAGE_SIZE = 25;

const { leaveIfSignedOut } = useAdminApi();
// Список, поиск, сортировка и страница таблицы переживают переход к зрителю и возврат
const viewers = useState<AdminViewer[] | null>('admin-viewers', () => null);
const problem = ref('');
const loading = ref(false);

const load = async () => {
  loading.value = true;
  try {
    viewers.value = await $fetch<AdminViewer[]>('/api/admin/viewers');
    problem.value = '';
  } catch (error) {
    if (!(await leaveIfSignedOut(error))) problem.value = adminErrorText(error);
  }
  loading.value = false;
};
onMounted(load);

const SORTS = {
  coins: { label: 'По монетам', compare: (a: AdminViewer, b: AdminViewer) => b.coins - a.coins },
  xp: { label: 'По уровню и XP', compare: (a: AdminViewer, b: AdminViewer) => b.lvl - a.lvl || b.xp - a.xp },
  recent: {
    label: 'По активности в чате',
    // Даты в ISO сравниваются как строки; без даты — в конец
    compare: (a: AdminViewer, b: AdminViewer) => (b.lastXpAt ?? '').localeCompare(a.lastXpAt ?? ''),
  },
  name: { label: 'По нику', compare: (a: AdminViewer, b: AdminViewer) => a.username.localeCompare(b.username) },
};
type Sort = keyof typeof SORTS;
const sortItems = (Object.keys(SORTS) as Sort[]).map((value) => ({ value, label: SORTS[value].label }));

const query = useState('admin-viewers-query', () => '');
const sort = useState<Sort>('admin-viewers-sort', () => 'coins');
const page = useState('admin-viewers-page', () => 1);
watch([query, sort], () => (page.value = 1));

const found = computed(() => {
  const needle = query.value.trim().replace(/^@/, '').toLowerCase();
  return (viewers.value ?? [])
    .filter((viewer) => viewer.username.toLowerCase().includes(needle))
    .sort((a, b) => SORTS[sort.value].compare(a, b) || a.id - b.id);
});
const rows = computed(() => found.value.slice((page.value - 1) * PAGE_SIZE, page.value * PAGE_SIZE));

const totals = computed(() => {
  const list = viewers.value ?? [];
  return [
    ['Зрителей', list.length],
    ['Монет у всех', list.reduce((sum, viewer) => sum + viewer.coins, 0)],
    ['XP у всех', list.reduce((sum, viewer) => sum + viewer.xp, 0)],
  ] as const;
});

const columns = [
  { accessorKey: 'username', header: 'Ник' },
  // Баланс вторым: на узком экране таблица прокручивается вбок, а он виден сразу
  { accessorKey: 'coins', header: 'Монеты' },
  { accessorKey: 'lvl', header: 'Уровень' },
  { accessorKey: 'xp', header: 'XP' },
  { accessorKey: 'lastXpAt', header: 'Последний XP за чат' },
];
</script>

<template>
  <AdminPage title="Зрители">
    <UAlert
      v-if="problem"
      color="error"
      variant="subtle"
      icon="i-lucide-unplug"
      title="Не удалось загрузить зрителей"
      :description="problem"
    />

    <template v-if="viewers">
      <dl class="grid gap-3 sm:grid-cols-3">
        <UCard v-for="[label, value] in totals" :key="label">
          <dt class="text-sm text-muted">{{ label }}</dt>
          <dd class="text-2xl font-semibold text-highlighted tabular-nums">{{ formatNumber(value) }}</dd>
        </UCard>
      </dl>

      <div class="flex flex-wrap items-center gap-2">
        <UInput
          v-model="query"
          type="search"
          icon="i-lucide-search"
          size="lg"
          placeholder="Найти по нику"
          aria-label="Поиск зрителя по нику"
          class="w-full max-w-md"
        />
        <USelect v-model="sort" :items="sortItems" size="lg" class="w-56" aria-label="Сортировка" />
        <UButton
          size="lg"
          color="neutral"
          variant="subtle"
          icon="i-lucide-refresh-cw"
          class="ml-auto"
          :loading="loading"
          @click="load"
        >
          Обновить
        </UButton>
      </div>

      <UTable
        :data="rows"
        :columns="columns"
        :empty="viewers.length ? 'Никого не нашлось' : 'В базе пока нет зрителей'"
        class="shrink-0 rounded-md border border-default"
      >
        <template #username-cell="{ row }">
          <div class="flex flex-wrap items-center gap-2">
            <!-- Ник белый, а не цвета акцента: иначе с ним сливаются метки -->
            <UButton
              :to="`/admin/viewers/${row.original.id}`"
              color="neutral"
              variant="link"
              class="p-0 font-semibold text-highlighted hover:underline"
            >
              {{ row.original.username }}
            </UButton>
            <AdminViewerBadges :viewer="row.original" />
          </div>
        </template>
        <template #lvl-cell="{ row }">
          <span class="font-semibold text-highlighted tabular-nums">{{ row.original.lvl }}</span>
          <span class="ml-2 text-xs text-dimmed">{{ getRankConfigByLevel(row.original.lvl).rankTitle }}</span>
        </template>
        <template #xp-cell="{ row }">
          <span class="tabular-nums">{{ formatNumber(row.original.xp) }}</span>
        </template>
        <template #coins-cell="{ row }">
          <span class="font-semibold text-highlighted tabular-nums">{{ formatNumber(row.original.coins) }}</span>
        </template>
        <template #lastXpAt-cell="{ row }">{{ formatDate(row.original.lastXpAt) }}</template>
      </UTable>

      <div class="flex flex-wrap items-center justify-between gap-2">
        <span class="text-sm text-muted">Найдено: {{ found.length }}. Ник открывает страницу зрителя.</span>
        <UPagination
          v-if="found.length > PAGE_SIZE"
          v-model:page="page"
          :total="found.length"
          :items-per-page="PAGE_SIZE"
        />
      </div>
      <p class="text-xs text-dimmed">Метки «mod» и «sub» берутся из последнего сообщения зрителя.</p>
    </template>
  </AdminPage>
</template>
