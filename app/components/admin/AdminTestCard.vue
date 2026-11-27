<script setup lang="ts">
// Тестовые алерты и карточки: настоящие события оверлея с придуманными данными. В базу и чат ничего не пишется.
import { TEST_EVENTS, TEST_NAME_MAX, parseTestName, type TestEventKind } from '#shared/testEvents';

defineProps<{ disabled: boolean }>();

const { act } = useAdminApi();
const username = ref('TestViewer');
const name = computed(() => parseTestName(username.value));
const groups = [
  { title: 'Алерты', items: TEST_EVENTS.filter((item) => item.group === 'alert') },
  { title: 'Карточки', items: TEST_EVENTS.filter((item) => item.group === 'card') },
];

const send = (kind: TestEventKind, label: string) =>
  act('/api/admin/stream/test', { kind, username: name.value }, `Отправлено на оверлей: ${label}`);
</script>

<template>
  <UCard>
    <template #header>
      <h2 class="text-lg font-semibold text-highlighted">Тестовые алерты и карточки</h2>
    </template>

    <div class="flex flex-col gap-4">
      <UAlert
        color="warning"
        variant="subtle"
        icon="i-lucide-monitor-play"
        description="Всё это видно на стриме, если оверлеи открыты в OBS. В базу и чат ничего не пишется."
      />
      <UFormField label="Ник на карточке">
        <UInput v-model="username" :maxlength="TEST_NAME_MAX" size="lg" class="w-full max-w-xs" />
      </UFormField>
      <div v-for="group in groups" :key="group.title">
        <h3 class="text-sm font-semibold text-muted">{{ group.title }}</h3>
        <div class="mt-2 flex flex-wrap gap-2">
          <UButton
            v-for="item in group.items"
            :key="item.kind"
            size="lg"
            color="neutral"
            variant="subtle"
            :disabled="disabled || !name"
            @click="send(item.kind, item.label)"
          >
            {{ item.label }}
          </UButton>
        </div>
      </div>
    </div>
  </UCard>
</template>
