<script setup lang="ts">
// Башня героев на странице «Игры»: только показ. Бонус меняется сам по календарю, все числа берутся
// из shared/tower.ts и shared/towerBonus.ts, поэтому после правки баланса здесь ничего менять не надо.
import { getBossById } from '#shared/bosses';
import type { CodeCommandName } from '#shared/commands';
import { BOSS_FLOORS, floorCoins, floorXp, lossXp, TOWER_CONFIG, TOWER_FLOORS } from '#shared/tower';
import { BONUS_PERIOD_DAYS, currentBonus, nextBonusChange, TOWER_BONUSES } from '#shared/towerBonus';

const props = defineProps<{ prefix: string; links: readonly { label: string; to: string; icon: string }[] }>();

const commands: CodeCommandName[] = ['tower'];

const now = ref(new Date());
// Бонус сменится в полночь, а страница может висеть открытой сутками
let timer: ReturnType<typeof setInterval> | undefined;
onMounted(() => (timer = setInterval(() => (now.value = new Date()), 60_000)));
onBeforeUnmount(() => clearInterval(timer));

const formatDay = (date: Date): string => date.toLocaleDateString('ru', { day: 'numeric', month: 'long' });

// Все бонусы по очереди, начиная с сегодняшнего, с датой, когда каждый включится
const rotation = computed(() => {
  const start = TOWER_BONUSES.findIndex((bonus) => bonus.id === currentBonus(now.value).id);
  const next = nextBonusChange(now.value);
  return TOWER_BONUSES.map((_, step) => ({
    ...TOWER_BONUSES[(start + step) % TOWER_BONUSES.length]!,
    from: new Date(next.getFullYear(), next.getMonth(), next.getDate() + (step - 1) * BONUS_PERIOD_DAYS),
  }));
});
const today = computed(() => rotation.value[0]!);
const upcoming = computed(() => rotation.value[1]!);
const changesIn = computed(() => {
  const midnight = new Date(now.value.getFullYear(), now.value.getMonth(), now.value.getDate());
  const days = Math.round((upcoming.value.from.getTime() - midnight.getTime()) / 86_400_000);
  return days <= 1 ? 'завтра' : `через ${days} дн.`;
});

const bosses = Object.entries(BOSS_FLOORS).map(([floor, id]) => ({ floor, name: getBossById(id)?.name ?? id }));

const numbers = [
  { label: 'Этажей', value: TOWER_FLOORS },
  { label: 'Боссов', value: bosses.length },
  { label: 'Попыток в день', value: TOWER_CONFIG.ATTEMPTS_PER_DAY },
];

const rules = computed(() => [
  `Зритель пишет ${props.prefix || '!'}tower, и активный герой идёт на следующий этаж. Бой проходит сам и показывается на оверлее.`,
  'Бои идут по одному, остальные ждут в очереди. Итог бот пишет в чат после боя.',
  `У каждого зрителя ${TOWER_CONFIG.ATTEMPTS_PER_DAY} попыток в день, победа и поражение тратят по одной. Сброс в полночь.`,
  `Каждый ${TOWER_CONFIG.BOSS_EVERY}-й этаж занимает босс, на остальных стоят герои каталога в другом цвете.`,
  'Прогресс по этажам у каждого героя свой. После поражения герой пробует тот же этаж снова.',
  'Скорость решает, кто бьёт чаще. Урон равен атаке минус половина защиты противника, но не меньше 1.',
  `За победу герой получает опыт: от ${floorXp(1)} на первом этаже до ${floorXp(TOWER_FLOORS)} на последнем.`,
  `За поражение опыт тоже идёт, но меньше: от ${lossXp(1)} до ${lossXp(TOWER_FLOORS)}.`,
  `Монеты, от ${floorCoins(1)} до ${floorCoins(TOWER_FLOORS)}, зритель получает за каждый этаж только один раз, даже другим героем.`,
]);
</script>

<template>
  <AdminGameCard
    title="Башня героев"
    icon="i-lucide-castle"
    summary="Герои зрителей бьются этаж за этажом: так они растут в уровне и приносят монеты."
    feature="tower"
    :commands="commands"
    :prefix="prefix"
    :links="links"
  >
    <div class="flex items-start gap-3 rounded-md bg-elevated/50 p-3">
      <TowerBonusIcon :id="today.id" class="size-8 shrink-0 text-primary" />
      <div>
        <div class="flex flex-wrap items-center gap-2 text-sm text-muted">
          Бонус сегодня
          <AdminFeatureBadges id="tower-bonus" />
        </div>
        <div class="font-semibold text-highlighted">{{ today.title }}: {{ today.description }}</div>
        <div class="text-sm text-muted">
          Сменится {{ changesIn }}, {{ formatDay(upcoming.from) }}. Дальше «{{ upcoming.title }}»:
          {{ upcoming.description }}.
        </div>
      </div>
    </div>

    <dl class="grid grid-cols-3 gap-2 text-center">
      <div v-for="item in numbers" :key="item.label" class="flex flex-col-reverse justify-end rounded-md border border-default p-2">
        <dt class="text-xs text-muted">{{ item.label }}</dt>
        <dd class="text-xl font-bold text-highlighted tabular-nums">{{ item.value }}</dd>
      </div>
    </dl>

    <template #details>
      <div>
        <h3 class="font-semibold text-highlighted">Все бонусы по очереди</h3>
        <p class="text-sm text-muted">
          Один бонус действует {{ BONUS_PERIOD_DAYS }} дня, одинаково для всех. Меняется сам, нажимать ничего не нужно.
        </p>
        <ul class="mt-2 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          <li
            v-for="(bonus, step) in rotation"
            :key="bonus.id"
            class="flex items-center gap-3 rounded-md border p-3"
            :class="step === 0 ? 'border-primary bg-primary/10' : 'border-default'"
          >
            <TowerBonusIcon :id="bonus.id" class="size-7 shrink-0 text-primary" />
            <div class="min-w-0">
              <div class="font-semibold text-highlighted">{{ bonus.title }}</div>
              <div class="text-sm text-muted">{{ bonus.description }}</div>
              <div class="text-xs" :class="step === 0 ? 'font-semibold text-primary' : 'text-dimmed'">
                {{ step === 0 ? 'действует сейчас' : `с ${formatDay(bonus.from)}` }}
              </div>
            </div>
          </li>
        </ul>
      </div>

      <div>
        <h3 class="font-semibold text-highlighted">Правила</h3>
        <ul class="mt-2 list-disc space-y-1 pl-5 text-sm">
          <li v-for="rule in rules" :key="rule">{{ rule }}</li>
        </ul>
      </div>

      <div>
        <h3 class="font-semibold text-highlighted">Боссы</h3>
        <div class="mt-2 flex flex-wrap gap-2">
          <UBadge v-for="boss in bosses" :key="boss.floor" color="neutral" variant="subtle" size="lg">
            {{ boss.floor }} этаж: {{ boss.name }}
          </UBadge>
        </div>
      </div>
    </template>
  </AdminGameCard>
</template>
