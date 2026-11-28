<script setup lang="ts">
// Таймер над чатом: то же, что !timer и !stoptimer, плюс пауза и ±1 минута. Остаток считается от `endsAt`,
// который прислал бот, а на паузе берётся замороженный `pausedLeftMs`. В чат бот из пульта не пишет.
import type { AdminStreamState } from '#shared/admin';
import { TIMER_CONFIG } from '#shared/economy';
import { TIMER_TITLE_MAX } from '#shared/events';

const props = defineProps<{ state: AdminStreamState | null }>();
const emit = defineEmits<{ changed: [] }>();

const { act } = useAdminApi();
const minutes = ref<number>(5);
const title = ref('');
const presets = [1, 5, 10, 15];
const busy = ref(false);

const now = ref(Date.now());
let ticker: ReturnType<typeof setInterval> | undefined;
onMounted(() => (ticker = setInterval(() => (now.value = Date.now()), 1000)));
onBeforeUnmount(() => clearInterval(ticker));

const timer = computed(() => props.state?.timer ?? null);
const paused = computed(() => timer.value?.pausedLeftMs !== undefined);
const secondsLeft = computed(() => {
  const current = timer.value;
  if (!current) return 0;
  const ms = current.pausedLeftMs ?? current.endsAt - now.value;
  return Math.max(0, Math.ceil(ms / 1000));
});
// Дошёл до нуля — таймера для пульта уже нет, даже если опрос бота ещё не обновился
const active = computed(() => !!timer.value && secondsLeft.value > 0);
const left = computed(
  () => `${Math.floor(secondsLeft.value / 60)}:${String(secondsLeft.value % 60).padStart(2, '0')}`,
);
const valid = computed(
  () => Number.isInteger(minutes.value) && minutes.value >= 1 && minutes.value <= TIMER_CONFIG.MAX_MINUTES,
);

const send = async (body: Record<string, unknown>, done: string) => {
  busy.value = true;
  if (await act('/api/admin/stream/timer', body, done)) emit('changed');
  busy.value = false;
};
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex flex-wrap items-center justify-between gap-2">
        <h2 class="text-lg font-semibold text-highlighted">Таймер</h2>
        <UBadge v-if="active" :color="paused ? 'warning' : 'success'" variant="subtle" size="lg" class="tabular-nums">
          «{{ timer?.title }}» {{ paused ? 'на паузе' : 'идёт' }}, осталось {{ left }}
        </UBadge>
        <UBadge v-else color="neutral" variant="subtle" size="lg">нет таймера</UBadge>
      </div>
    </template>

    <div class="flex flex-col gap-4">
      <div class="flex flex-wrap gap-2">
        <UButton
          v-for="preset in presets"
          :key="preset"
          size="lg"
          :color="minutes === preset ? 'primary' : 'neutral'"
          :variant="minutes === preset ? 'solid' : 'subtle'"
          @click="minutes = preset"
        >
          {{ preset }} мин
        </UButton>
        <UInputNumber
          v-model="minutes"
          :min="1"
          :max="TIMER_CONFIG.MAX_MINUTES"
          size="lg"
          class="w-36"
          aria-label="Минуты таймера"
        />
      </div>
      <UFormField label="Название">
        <UInput
          v-model="title"
          :maxlength="TIMER_TITLE_MAX"
          placeholder="Timer"
          size="lg"
          class="w-full max-w-sm"
        />
      </UFormField>
      <div class="flex flex-wrap gap-2">
        <UButton
          size="xl"
          icon="i-lucide-timer"
          :disabled="!state || !valid"
          :loading="busy"
          @click="send({ action: 'start', minutes, title }, `Таймер запущен на ${minutes} мин`)"
        >
          {{ active ? `Заменить на ${minutes} мин` : `Старт на ${minutes} мин` }}
        </UButton>
        <UButton
          v-if="paused"
          size="xl"
          color="neutral"
          variant="subtle"
          icon="i-lucide-play"
          :disabled="busy"
          @click="send({ action: 'resume' }, 'Таймер продолжен')"
        >
          Продолжить
        </UButton>
        <UButton
          v-else
          size="xl"
          color="neutral"
          variant="subtle"
          icon="i-lucide-pause"
          :disabled="!active || busy"
          @click="send({ action: 'pause' }, 'Таймер на паузе')"
        >
          Пауза
        </UButton>
        <UButton
          size="xl"
          color="neutral"
          variant="subtle"
          icon="i-lucide-square"
          :disabled="!active || busy"
          @click="send({ action: 'stop' }, 'Таймер остановлен')"
        >
          Стоп
        </UButton>
      </div>
      <div class="flex flex-wrap gap-2">
        <UButton
          size="lg"
          color="neutral"
          variant="outline"
          icon="i-lucide-minus"
          :disabled="!active || busy"
          @click="send({ action: 'adjust', minutes: -1 }, '−1 минута')"
        >
          1 мин
        </UButton>
        <UButton
          size="lg"
          color="neutral"
          variant="outline"
          icon="i-lucide-plus"
          :disabled="!active || busy"
          @click="send({ action: 'adjust', minutes: 1 }, '+1 минута')"
        >
          1 мин
        </UButton>
      </div>
      <p class="text-sm text-muted">Таймер виден на сцене в шапке. В чат бот о нём из пульта не пишет.</p>
    </div>
  </UCard>
</template>
