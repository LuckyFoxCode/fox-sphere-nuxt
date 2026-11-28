<script setup lang="ts">
// События: сезонные темы оверлея (Рождество и другие праздники по одной). Состояние перечитывается раз в 5 с.
import { SEASONS, type SeasonStates } from '#shared/seasons';

definePageMeta({ layout: 'admin', middleware: 'admin' });

const { leaveIfSignedOut } = useAdminApi();
const states = ref<SeasonStates | null>(null);
const problem = ref('');

const load = async () => {
  try {
    states.value = await $fetch<SeasonStates>('/api/seasons');
    problem.value = '';
  } catch (error) {
    if (!(await leaveIfSignedOut(error))) problem.value = adminErrorText(error);
  }
};

let timer: ReturnType<typeof setTimeout> | undefined;
let alive = true;
const refresh = async () => {
  await load();
  if (alive) timer = setTimeout(refresh, 5000);
};
onMounted(refresh);
onBeforeUnmount(() => {
  alive = false;
  clearTimeout(timer);
});
</script>

<template>
  <AdminPage title="События">
    <UAlert
      v-if="problem"
      color="error"
      variant="subtle"
      icon="i-lucide-unplug"
      title="Не удалось загрузить события"
      :description="problem"
    />

    <div class="grid items-start gap-4 xl:grid-cols-2">
      <AdminSeasonCard
        v-for="season in SEASONS"
        :key="season.id"
        :season="season"
        :state="states?.[season.id] ?? null"
        @changed="load"
      />
    </div>
  </AdminPage>
</template>
