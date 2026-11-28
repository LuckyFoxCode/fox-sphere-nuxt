<script setup lang="ts">
// Игры: что есть в чате и на оверлее и по каким правилам. Только просмотр, настраивать здесь нечего:
// управление бустом и лотереей остаётся на пульте эфира, команды — в разделе «Команды».
import type { AdminCommands } from '#shared/commands';
import { getHeroStats, HEROES } from '#shared/heroes';
import { adminGames, commandsLink } from '~/utils/adminGames';

definePageMeta({ layout: 'admin', middleware: 'admin' });

const { leaveIfSignedOut } = useAdminApi();
// Префикс команд зависит от окружения (dev «!t», prod «!»), поэтому берётся с сервера
const prefix = ref('');
const problem = ref('');

onMounted(async () => {
  try {
    prefix.value = (await $fetch<AdminCommands>('/api/admin/commands')).prefix;
  } catch (error) {
    if (!(await leaveIfSignedOut(error))) problem.value = adminErrorText(error);
  }
});

const games = computed(() => adminGames(prefix.value));
const towerLinks = [commandsLink('tower'), { label: 'Зрители', to: '/admin/viewers', icon: 'i-lucide-users' }];

const heroes = HEROES.map((hero) => ({
  ...hero,
  first: getHeroStats(hero.id, 1),
  last: getHeroStats(hero.id, hero.maxLevel),
}));
const heroStats = [
  { key: 'health', label: 'Здоровье' },
  { key: 'attack', label: 'Атака' },
  { key: 'defense', label: 'Защита' },
  { key: 'speed', label: 'Скорость' },
] as const;
</script>

<template>
  <AdminPage title="Игры" feature="games">
    <UAlert
      v-if="problem"
      color="error"
      variant="subtle"
      icon="i-lucide-unplug"
      title="Не удалось узнать префикс команд"
      :description="problem"
    />

    <p class="text-sm text-muted">
      Игры работают сами по командам из чата, настраивать здесь ничего не нужно. Нажмите «Подробнее», чтобы увидеть
      правила и числа.
    </p>

    <AdminTowerCard :prefix="prefix" :links="towerLinks" />

    <div class="grid items-start gap-4 lg:grid-cols-2">
      <AdminGameCard
        v-for="game in games"
        :key="game.id"
        :title="game.title"
        :icon="game.icon"
        :summary="game.summary"
        :commands="game.commands"
        :prefix="prefix"
        :links="game.links"
      >
        <template #details>
          <ul class="list-disc space-y-1 pl-5 text-sm">
            <li v-for="rule in game.rules" :key="rule">{{ rule }}</li>
          </ul>

          <ul v-if="game.id === 'heroes'" class="flex flex-col gap-2">
            <li v-for="hero in heroes" :key="hero.id" class="flex gap-3 rounded-md border border-default p-3">
              <!-- Увеличено: на листе героя вокруг фигуры много пустого поля -->
              <div class="size-16 shrink-0 overflow-hidden">
                <div class="size-full scale-175" :style="buildPortraitStyle(hero)" role="img" :aria-label="hero.name" />
              </div>
              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <span class="font-semibold text-highlighted">{{ hero.name }}</span>
                  <UBadge color="neutral" variant="subtle">
                    {{ hero.price ? `${hero.price} монет` : 'бесплатно' }}
                  </UBadge>
                </div>
                <dl class="mt-1 grid grid-cols-2 gap-x-4 text-sm">
                  <div v-for="stat in heroStats" :key="stat.key" class="flex justify-between gap-2">
                    <dt class="text-muted">{{ stat.label }}</dt>
                    <dd class="tabular-nums">
                      {{ hero.first[stat.key] }}
                      <template v-if="stat.key !== 'speed'">→ {{ hero.last[stat.key] }}</template>
                    </dd>
                  </div>
                </dl>
                <div class="mt-1 text-xs text-dimmed">Уровень 1 → {{ hero.maxLevel }}</div>
              </div>
            </li>
          </ul>

          <div v-if="game.table">
            <h3 class="font-semibold text-highlighted">{{ game.table.title }}</h3>
            <table class="mt-2 w-full text-sm">
              <thead>
                <tr class="border-b border-default text-left text-muted">
                  <th class="py-1 pr-4 font-medium">{{ game.table.head[0] }}</th>
                  <th class="py-1 text-right font-medium">{{ game.table.head[1] }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="[name, value] in game.table.rows" :key="name" class="border-b border-default last:border-0">
                  <td class="py-1 pr-4">{{ name }}</td>
                  <td class="py-1 text-right tabular-nums">{{ value }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>
      </AdminGameCard>
    </div>
  </AdminPage>
</template>
