<script setup lang="ts">
// Страница зрителя: уровень, статистика игр, ачивки, герои, стрики и вся история монет. Только чтение.
// Адрес по номеру в базе, а не по нику: ник зритель может сменить.
import { COIN_REASONS, type AdminViewerDetails } from '#shared/viewers';
import { getLevelRange } from '#shared/xp';
import { getRankConfigByLevel } from '~/utils/chat/ranks';

definePageMeta({ layout: 'admin', middleware: 'admin' });

const PAGE_SIZE = 30;

const route = useRoute();
const { leaveIfSignedOut } = useAdminApi();
const details = ref<AdminViewerDetails | null>(null);
const problem = ref('');
const loading = ref(false);

const load = async () => {
  loading.value = true;
  try {
    const id = encodeURIComponent(String(route.params.id));
    details.value = await $fetch<AdminViewerDetails>(`/api/admin/viewers/${id}`);
    problem.value = '';
  } catch (error) {
    if (!(await leaveIfSignedOut(error))) problem.value = adminErrorText(error);
  }
  loading.value = false;
};
onMounted(load);

// В названии вкладки ник: зрителей можно открыть в нескольких вкладках
useHead({
  title: () => (details.value ? `${details.value.viewer.username} · Админка` : 'Админка · fox-sphere'),
});

const crumbs = computed(() => [
  { label: 'Зрители', icon: 'i-lucide-users', to: '/admin/viewers' },
  { label: details.value?.viewer.username ?? 'Зритель' },
]);

const level = computed(() => {
  if (!details.value) return null;
  const { lvl, xp } = details.value.viewer;
  const { startXp, maxXp } = getLevelRange(lvl);
  const size = maxXp - startXp;
  const done = Math.min(Math.max(xp - startXp, 0), size);
  return { done, size, rank: getRankConfigByLevel(lvl).rankTitle };
});

const stats = computed(() => {
  const data = details.value;
  if (!data) return [];
  return [
    ['Монеты', data.viewer.coins],
    ['Всего XP', data.viewer.xp],
    ['XP за неделю (лотерея)', data.xpThisWeek],
    ['Лучший стрик', data.counters.bestStreak],
    ['Спинов рулетки', data.spinsCount],
    ['Выиграно в рулетке', data.totalWin],
    ['Проиграно в рулетке', data.totalLoss],
    ['Золотое пиво', data.goldenBeers],
  ] as const;
});

const page = ref(1);
const history = computed(() => details.value?.history ?? []);
const rows = computed(() => history.value.slice((page.value - 1) * PAGE_SIZE, page.value * PAGE_SIZE));
const columns = [
  { accessorKey: 'createdAt', header: 'Когда' },
  { accessorKey: 'reason', header: 'Операция' },
  { accessorKey: 'amount', header: 'Монеты' },
];
</script>

<template>
  <AdminPage :title="details?.viewer.username ?? 'Зритель'">
    <template #title>
      <UBreadcrumb :items="crumbs" />
    </template>

    <div class="flex flex-wrap items-center gap-2">
      <AdminViewerBadges v-if="details" :viewer="details.viewer" />
      <UButton
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

    <UAlert v-if="problem" color="error" variant="subtle" icon="i-lucide-unplug" :title="problem" />
    <p v-else-if="!details" class="text-muted">Загрузка…</p>

    <template v-if="details && level">
      <UCard>
        <div class="flex flex-col gap-3">
          <div class="flex flex-wrap items-baseline justify-between gap-2">
            <span class="text-xl font-semibold text-highlighted">
              Уровень {{ details.viewer.lvl }} · {{ level.rank }}
            </span>
            <span class="text-sm text-muted tabular-nums">
              {{ formatNumber(level.done) }} / {{ formatNumber(level.size) }} XP до следующего
            </span>
          </div>
          <UProgress :model-value="level.done" :max="level.size" />
          <p class="text-sm text-muted">
            Первый раз в базе: {{ formatDate(details.viewer.createdAt) }}. Последний XP за чат:
            {{ formatDate(details.viewer.lastXpAt) }}.
          </p>
        </div>
      </UCard>

      <dl class="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <UCard v-for="[label, value] in stats" :key="label">
          <dt class="text-sm text-muted">{{ label }}</dt>
          <dd class="text-2xl font-semibold text-highlighted tabular-nums">{{ formatNumber(value) }}</dd>
        </UCard>
      </dl>

      <AdminViewerAchievements :counters="details.counters" />

      <div class="grid items-start gap-4 xl:grid-cols-3">
        <div class="flex flex-col gap-4">
          <UCard>
            <template #header>
              <h2 class="text-lg font-semibold text-highlighted">Герои</h2>
            </template>
            <div v-if="details.heroes.length" class="flex flex-wrap gap-2">
              <UBadge
                v-for="hero in details.heroes"
                :key="hero.id"
                :color="hero.active ? 'primary' : 'neutral'"
                :variant="hero.active ? 'solid' : 'subtle'"
                size="lg"
              >
                {{ hero.name }}, ур. {{ hero.level }}{{ hero.active ? ' (надет)' : '' }}
              </UBadge>
            </div>
            <p v-else class="text-sm text-muted">Героев пока нет.</p>
          </UCard>

          <UCard>
            <template #header>
              <h2 class="text-lg font-semibold text-highlighted">Стрики просмотров</h2>
            </template>
            <ul v-if="details.streaks.length" class="max-h-96 divide-y divide-default overflow-y-auto">
              <li v-for="streak in details.streaks" :key="streak.value" class="flex justify-between gap-3 py-2">
                <span class="font-semibold tabular-nums">Стримов подряд: {{ streak.value }}</span>
                <span class="text-sm text-dimmed">{{ formatDate(streak.createdAt) }}</span>
              </li>
            </ul>
            <p v-else class="text-sm text-muted">Наград за стрик ещё не было.</p>
          </UCard>
        </div>

        <UCard class="xl:col-span-2">
          <template #header>
            <div class="flex flex-wrap items-center justify-between gap-2">
              <h2 class="text-lg font-semibold text-highlighted">История монет</h2>
              <UBadge color="neutral" variant="subtle" size="lg">операций: {{ history.length }}</UBadge>
            </div>
          </template>
          <div class="flex flex-col gap-3">
            <UTable
              :data="rows"
              :columns="columns"
              empty="Операций нет"
              class="shrink-0 rounded-md border border-default"
            >
              <template #createdAt-cell="{ row }">{{ formatDate(row.original.createdAt) }}</template>
              <template #reason-cell="{ row }">{{ COIN_REASONS[row.original.reason] ?? row.original.reason }}</template>
              <template #amount-cell="{ row }">
                <span
                  class="font-semibold tabular-nums"
                  :class="row.original.amount < 0 ? 'text-error' : 'text-success'"
                >
                  {{ row.original.amount > 0 ? '+' : '' }}{{ formatNumber(row.original.amount) }}
                </span>
              </template>
            </UTable>
            <UPagination
              v-if="history.length > PAGE_SIZE"
              v-model:page="page"
              :total="history.length"
              :items-per-page="PAGE_SIZE"
              class="self-end"
            />
          </div>
        </UCard>
      </div>
    </template>
  </AdminPage>
</template>
