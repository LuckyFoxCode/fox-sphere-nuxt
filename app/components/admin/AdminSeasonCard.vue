<script setup lang="ts">
// Одна сезонная тема: режим (выкл / авто по датам / вкл) и интенсивность. Сохраняется сразу, сцена подхватывает за несколько секунд.
import {
  resolveSeason,
  type SeasonInfo,
  type SeasonIntensity,
  type SeasonMode,
  type SeasonState,
} from '#shared/seasons';

const props = defineProps<{ season: SeasonInfo; state: SeasonState | null }>();
const emit = defineEmits<{ changed: [] }>();

const { leaveIfSignedOut } = useAdminApi();
const toast = useToast();
const saving = ref(false);

const MODES: { value: SeasonMode; label: string }[] = [
  { value: 'off', label: 'Выключено' },
  { value: 'auto', label: 'Авто по датам' },
  { value: 'on', label: 'Включено' },
];
const INTENSITIES: { value: SeasonIntensity; label: string }[] = [
  { value: 'light', label: 'Лёгкая' },
  { value: 'full', label: 'Полная' },
];

const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
const dates = computed(() => {
  const { from, to } = props.season;
  return `${from.day} ${MONTHS[from.month - 1]} – ${to.day} ${MONTHS[to.month - 1]}`;
});

const showing = computed(() => (props.state ? resolveSeason(props.season, props.state, new Date()) !== null : false));

const save = async (patch: { mode?: SeasonMode; intensity?: SeasonIntensity }) => {
  if (!props.state) return;
  saving.value = true;
  try {
    await $fetch('/api/admin/seasons', { method: 'POST', body: { id: props.season.id, ...patch } });
    emit('changed');
  } catch (error) {
    if (!(await leaveIfSignedOut(error))) {
      toast.add({ title: adminErrorText(error), color: 'error', icon: 'i-lucide-triangle-alert' });
    }
  }
  saving.value = false;
};
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between gap-4">
        <h2 class="text-lg font-semibold text-highlighted">{{ season.title }}</h2>
        <UBadge :color="showing ? 'success' : 'neutral'" variant="subtle">
          {{ showing ? 'сейчас на сцене' : 'сейчас не показывается' }}
        </UBadge>
      </div>
    </template>

    <div class="flex flex-col gap-5">
      <p class="text-sm text-muted">{{ season.description }}</p>

      <div class="flex flex-col gap-2">
        <p class="font-medium text-highlighted">Когда показывать</p>
        <URadioGroup
          :model-value="state?.mode"
          :items="MODES"
          orientation="horizontal"
          :disabled="state === null || saving"
          @update:model-value="save({ mode: $event as SeasonMode })"
        />
        <p class="text-sm text-muted">
          «Авто по датам»: с {{ dates }}. «Включено» и «Выключено» главнее дат: тема горит или молчит в любой день.
        </p>
      </div>

      <div class="flex flex-col gap-2">
        <p class="font-medium text-highlighted">Насколько заметно</p>
        <URadioGroup
          :model-value="state?.intensity"
          :items="INTENSITIES"
          orientation="horizontal"
          :disabled="state === null || saving"
          @update:model-value="save({ intensity: $event as SeasonIntensity })"
        />
        <p class="text-sm text-muted">
          «Лёгкая»: гирлянда и немного снега. «Полная»: ярче, больше снега и ёлочные шары на гирлянде.
        </p>
      </div>

      <p class="text-sm text-muted">
        Действует на общую сцену <code>/overlay/scene</code>. Отдельные источники OBS темы не показывают. Превью без OBS:
        <NuxtLink class="underline" to="/dev/seasons" target="_blank">/dev/seasons</NuxtLink>.
      </p>
    </div>
  </UCard>
</template>
