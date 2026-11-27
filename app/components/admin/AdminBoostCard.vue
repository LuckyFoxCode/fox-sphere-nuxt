<script setup lang="ts">
// Буст XP: то же, что !xpboost. Остаток считается от абсолютного момента окончания, который прислал бот.
import type { AdminStreamState } from '#shared/admin';
import { BOOST_CONFIG } from '#shared/economy';

const props = defineProps<{ state: AdminStreamState | null }>();
const emit = defineEmits<{ changed: [] }>();

const { act } = useAdminApi();
const minutes = ref<number>(BOOST_CONFIG.DEFAULT_MINUTES);
const presets = [5, 15, 30, 60];
const busy = ref(false);

const now = ref(Date.now());
let ticker: ReturnType<typeof setInterval> | undefined;
onMounted(() => (ticker = setInterval(() => (now.value = Date.now()), 1000)));
onBeforeUnmount(() => clearInterval(ticker));

const secondsLeft = computed(() => {
  const boost = props.state?.boost;
  return boost ? Math.max(0, Math.ceil((boost.expiresAt - now.value) / 1000)) : 0;
});
const left = computed(
  () => `${Math.floor(secondsLeft.value / 60)}:${String(secondsLeft.value % 60).padStart(2, '0')}`,
);
const valid = computed(
  () =>
    Number.isInteger(minutes.value) &&
    minutes.value >= BOOST_CONFIG.MIN_MINUTES &&
    minutes.value <= BOOST_CONFIG.MAX_MINUTES,
);

const send = async (body: Record<string, unknown>, done: string) => {
  busy.value = true;
  if (await act('/api/admin/stream/boost', body, done)) emit('changed');
  busy.value = false;
};
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex flex-wrap items-center justify-between gap-2">
        <h2 class="text-lg font-semibold text-highlighted">Буст XP</h2>
        <UBadge v-if="secondsLeft" color="success" variant="subtle" size="lg" class="tabular-nums">
          ×{{ state?.boost?.multiplier }} идёт, осталось {{ left }}
        </UBadge>
        <UBadge v-else color="neutral" variant="subtle" size="lg">выключен</UBadge>
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
          :min="BOOST_CONFIG.MIN_MINUTES"
          :max="BOOST_CONFIG.MAX_MINUTES"
          size="lg"
          class="w-36"
          aria-label="Минуты буста"
        />
      </div>
      <div class="flex flex-wrap gap-2">
        <UButton
          size="xl"
          icon="i-lucide-zap"
          :disabled="!state || !valid"
          :loading="busy"
          @click="send({ action: 'start', minutes }, `Буст включён на ${minutes} мин`)"
        >
          {{ secondsLeft ? `Заменить на ${minutes} мин` : `Включить на ${minutes} мин` }}
        </UButton>
        <UButton
          size="xl"
          color="neutral"
          variant="subtle"
          icon="i-lucide-zap-off"
          :disabled="!secondsLeft || busy"
          @click="send({ action: 'stop' }, 'Буст выключен')"
        >
          Выключить
        </UButton>
      </div>
      <p v-if="state" class="text-sm text-muted">
        {{
          state.production
            ? 'Бот напишет об этом в чат той же фразой, что на !xpboost.'
            : 'Это dev: в чат бот о бусте не пишет.'
        }}
      </p>
    </div>
  </UCard>
</template>
