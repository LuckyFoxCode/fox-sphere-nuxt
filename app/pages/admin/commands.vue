<script setup lang="ts">
// Команды чата по группам: текстовые из базы редактируются, команды из кода и их фразы только показаны.
import {
  CODE_COMMANDS,
  COMMAND_CATEGORIES,
  COMMAND_ROLES,
  TEXT_COMMAND_INFO,
  type AdminCommands,
  type CodeCommandName,
  type CommandRole,
} from '#shared/commands';
import { phraseSections } from '~/utils/botPhrases';

definePageMeta({ layout: 'admin', middleware: 'admin' });

const { leaveIfSignedOut } = useAdminApi();
const data = ref<AdminCommands | null>(null);
const problem = ref('');

const fetchCommands = async (): Promise<AdminCommands | null> => {
  try {
    const next = await $fetch<AdminCommands>('/api/admin/commands');
    problem.value = '';
    return next;
  } catch (error) {
    if (!(await leaveIfSignedOut(error))) problem.value = adminErrorText(error);
    return null;
  }
};

onMounted(async () => (data.value = await fetchCommands()));

// После сохранения заменяется только изменённая команда: правки в других карточках остаются
const reload = async (name: string): Promise<boolean> => {
  const fresh = (await fetchCommands())?.text.find((command) => command.name === name);
  if (!fresh || !data.value) return false;
  data.value.text = data.value.text.map((command) => (command.name === name ? fresh : command));
  return true;
};

const filter = ref<CommandRole | 'all'>('all');
const matches = (role: CommandRole) => filter.value === 'all' || filter.value === role;

const query = ref('');
const categoryTitle = (id: string) => COMMAND_CATEGORIES.find((category) => category.id === id)?.title ?? '';
// Поиск по имени и алиасам (с префиксом, с «!» или без), описанию и названию группы
const found = (name: string, aliases: readonly string[], category: string, description = ''): boolean => {
  const needle = query.value.trim().toLowerCase();
  if (!needle) return true;
  const prefix = data.value?.prefix ?? '!';
  const names = [name, ...aliases].flatMap((item) => [`!${item}`, `${prefix}${item}`]);
  return [...names, description, categoryTitle(category)].some((text) => text.toLowerCase().includes(needle));
};

const codeNames = Object.keys(CODE_COMMANDS) as CodeCommandName[];
// Порядок текстовых команд — как в каталоге, незнакомые в конце
const textOrder = Object.keys(TEXT_COMMAND_INFO);
const rank = (name: string) => (textOrder.includes(name) ? textOrder.indexOf(name) : textOrder.length);

const groups = computed(() => {
  if (!data.value) return [];
  const { text, prefix } = data.value;
  const phrases = phraseSections(prefix);
  return COMMAND_CATEGORIES.map((category) => ({
    ...category,
    text: text
      .filter((command) => (TEXT_COMMAND_INFO[command.name]?.category ?? 'other') === category.id)
      .sort((a, b) => rank(a.name) - rank(b.name)),
    code: codeNames.filter((name) => CODE_COMMANDS[name].category === category.id),
    phrases: phrases.find((section) => section.category === category.id),
  })).filter((group) => group.text.length || group.code.length);
});

// Что подходит под поиск, с ролью каждой команды. Текстовые команды доступны всем зрителям
const searched = computed(() => {
  const roles = new Map<string, CommandRole>();
  for (const command of data.value?.text ?? []) {
    const info = TEXT_COMMAND_INFO[command.name];
    if (found(command.name, command.aliases, info?.category ?? 'other', info?.description)) {
      roles.set(command.name, 'viewer');
    }
  }
  for (const name of codeNames) {
    const { aliases, category, description, role } = CODE_COMMANDS[name];
    if (found(name, aliases, category, description)) roles.set(name, role);
  }
  return roles;
});
// Проходит и поиск, и фильтр по ролям
const visible = (name: string, role: CommandRole) => searched.value.has(name) && matches(role);
const shownCount = computed(() => [...searched.value.values()].filter(matches).length);

type Group = (typeof groups.value)[number];
const hasCode = (group: Group) => group.code.some((name) => visible(name, CODE_COMMANDS[name].role));
const hasShown = (group: Group) => group.text.some((command) => visible(command.name, 'viewer')) || hasCode(group);

const filters = computed(() => {
  const roles = [...searched.value.values()];
  return [
    { value: 'all' as const, label: 'Все команды', count: roles.length },
    ...(Object.keys(COMMAND_ROLES) as CommandRole[]).map((value) => ({
      value,
      label: COMMAND_ROLES[value],
      count: roles.filter((role) => role === value).length,
    })),
  ];
});

// Несохранённые тексты: перед уходом со страницы спрашиваем
const unsaved = new Set<string>();
const setDirty = (name: string, value: boolean) => (value ? unsaved.add(name) : unsaved.delete(name));
onBeforeRouteLeave(() => unsaved.size === 0 || window.confirm('Есть несохранённые тексты. Уйти без сохранения?'));
const warnUnload = (event: BeforeUnloadEvent) => {
  if (unsaved.size > 0) event.preventDefault();
};
onMounted(() => window.addEventListener('beforeunload', warnUnload));
onBeforeUnmount(() => window.removeEventListener('beforeunload', warnUnload));
</script>

<template>
  <AdminPage title="Команды">
    <UAlert
      v-if="problem"
      color="error"
      variant="subtle"
      icon="i-lucide-unplug"
      title="Не удалось загрузить команды"
      :description="problem"
    />

    <template v-if="data">
      <UInput
        v-model="query"
        type="search"
        icon="i-lucide-search"
        size="lg"
        placeholder="Найти команду: gh, !timer, рулетка"
        aria-label="Поиск по командам"
        class="w-full max-w-md"
      />

      <div class="flex flex-wrap gap-2" role="group" aria-label="Кто может вызвать команду">
        <UButton
          v-for="item in filters"
          :key="item.value"
          :color="filter === item.value ? 'primary' : 'neutral'"
          :variant="filter === item.value ? 'solid' : 'subtle'"
          :aria-pressed="filter === item.value"
          @click="filter = item.value"
        >
          {{ item.label }}: {{ item.count }}
        </UButton>
      </div>

      <p class="text-sm text-muted">
        Бот отвечает на <b>{{ data.botLang }}</b>, префикс команд <code>{{ data.prefix }}</code>. Сохранённые тексты он
        подхватывает примерно за 30 секунд. В ответах можно писать <code v-pre>{user}</code> (ник),
        <code v-pre>{prefix}</code> (префикс) и <code v-pre>{version}</code> (версия). Если вариантов несколько, бот
        выбирает случайный. Права и фразы команд из кода здесь только показаны.
      </p>

      <UAlert
        v-if="!data.text.length"
        color="warning"
        variant="subtle"
        icon="i-lucide-database"
        title="В базе нет текстовых команд"
        description="Заполните их шаблонами: pnpm db:seed:dev (для боевой базы pnpm db:seed:prod)."
      />

      <p v-if="shownCount === 0" class="text-muted">Ничего не нашлось. Измените запрос или фильтр по ролям.</p>

      <!-- v-show, а не v-if: поиск и фильтр не должны стирать несохранённые правки -->
      <section v-for="group in groups" v-show="hasShown(group)" :key="group.id" class="flex flex-col gap-3">
        <div class="mt-4">
          <h2 class="text-lg font-semibold text-highlighted">{{ group.title }}</h2>
          <p class="text-sm text-muted">{{ group.description }}</p>
        </div>

        <AdminTextCommandCard
          v-for="command in group.text"
          v-show="visible(command.name, 'viewer')"
          :key="command.name"
          :command="command"
          :prefix="data.prefix"
          :bot-lang="data.botLang"
          :description="TEXT_COMMAND_INFO[command.name]?.description"
          :personal="TEXT_COMMAND_INFO[command.name]?.personal"
          :reload="reload"
          @dirty="setDirty"
        />

        <UCard v-if="hasCode(group)">
          <div class="flex flex-col divide-y divide-default">
            <div
              v-for="name in group.code.filter((item) => visible(item, CODE_COMMANDS[item].role))"
              :key="name"
              class="flex flex-col gap-2 py-3 first:pt-0 last:pb-0"
            >
              <AdminCommandTitle
                :name="name"
                :aliases="CODE_COMMANDS[name].aliases"
                :prefix="data.prefix"
                :role="CODE_COMMANDS[name].role"
              >
                <UBadge color="neutral" variant="subtle" icon="i-lucide-code">из кода</UBadge>
              </AdminCommandTitle>
              <p class="text-sm text-muted">{{ CODE_COMMANDS[name].description }}</p>
            </div>
          </div>
        </UCard>

        <AdminPhrases
          v-if="group.phrases && group.code.length"
          v-show="hasCode(group)"
          :section="group.phrases"
          :prefix="data.prefix"
          :bot-lang="data.botLang"
        />
      </section>
    </template>
  </AdminPage>
</template>
