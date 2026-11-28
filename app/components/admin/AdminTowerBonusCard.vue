<script setup lang="ts">
// Бонус башни дня: только показ. Он меняется сам раз в 3 дня по календарю, управлять нечем.
import { currentBonus, nextBonusChange, TOWER_BONUSES } from '#shared/towerBonus';

const now = ref(new Date());
const bonus = computed(() => currentBonus(now.value));
const daysLeft = computed(() =>
  Math.max(1, Math.round((nextBonusChange(now.value).getTime() - now.value.getTime()) / 86_400_000)),
);
const upcoming = computed(() => {
  const index = TOWER_BONUSES.findIndex((b) => b.id === bonus.value.id);
  return TOWER_BONUSES[(index + 1) % TOWER_BONUSES.length];
});

// Бонус сменится в полночь, а страница настроек может висеть открытой сутками
let timer: ReturnType<typeof setInterval> | undefined;
onMounted(() => (timer = setInterval(() => (now.value = new Date()), 60_000)));
onBeforeUnmount(() => clearInterval(timer));
</script>

<template>
  <UCard>
    <template #header>
      <h2 class="text-lg font-semibold text-highlighted">Бонус башни</h2>
    </template>
    <div class="flex items-center gap-3">
      <TowerBonusIcon
        :id="bonus.id"
        class="size-8 shrink-0 text-primary"
      />
      <div>
        <div class="font-semibold text-highlighted">{{ bonus.title }}: {{ bonus.description }}</div>
        <div class="text-sm text-muted">
          Сменится через {{ daysLeft }} дн., дальше «{{ upcoming?.title }}». Меняется сам раз в 3 дня.
        </div>
      </div>
    </div>
  </UCard>
</template>
