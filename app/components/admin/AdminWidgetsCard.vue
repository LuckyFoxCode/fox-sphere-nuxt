<script setup lang="ts">
// Тумблеры виджетов общей сцены: сохраняются сразу, оверлей в OBS подхватывает за несколько секунд.
import { WIDGETS, type WidgetId, type WidgetStates } from '#shared/widgets';

const props = defineProps<{ states: WidgetStates | null }>();
const emit = defineEmits<{ changed: [] }>();

const { leaveIfSignedOut } = useAdminApi();
const toast = useToast();
const saving = ref<WidgetId | null>(null);

const toggle = async (id: WidgetId, enabled: boolean) => {
  if (props.states === null) return;
  saving.value = id;
  try {
    await $fetch('/api/admin/widgets', { method: 'POST', body: { id, enabled } });
    emit('changed');
  } catch (error) {
    if (!(await leaveIfSignedOut(error))) {
      toast.add({ title: adminErrorText(error), color: 'error', icon: 'i-lucide-triangle-alert' });
    }
  }
  saving.value = null;
};
</script>

<template>
  <UCard>
    <template #header>
      <h2 class="text-lg font-semibold text-highlighted">Виджеты сцены</h2>
    </template>

    <div class="flex flex-col gap-4">
      <ul class="flex flex-col divide-y divide-default">
        <li v-for="widget in WIDGETS" :key="widget.id" class="flex items-center justify-between gap-4 py-3">
          <div class="min-w-0">
            <p class="font-medium text-highlighted">{{ widget.title }}</p>
            <p class="text-sm text-muted">{{ widget.description }}</p>
          </div>
          <USwitch
            :model-value="states?.[widget.id] ?? false"
            :disabled="states === null || saving === widget.id"
            :aria-label="widget.title"
            @update:model-value="toggle(widget.id, $event)"
          />
        </li>
      </ul>
      <p class="text-sm text-muted">
        Действует на общую сцену <code>/overlay/scene</code>. Отдельные источники OBS этих переключателей не читают.
      </p>
    </div>
  </UCard>
</template>
