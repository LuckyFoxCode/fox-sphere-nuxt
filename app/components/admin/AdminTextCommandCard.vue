<script setup lang="ts">
// Текстовая команда: ответы на трёх языках рядом и переключатель. Переключатель сохраняется сразу,
// тексты — кнопкой. Права у текстовых команд не настраиваются: их вызывает любой зритель.
import {
  CHAT_MESSAGE_LIMIT,
  MAX_RESPONSES,
  parseTextCommandUpdate,
  responseLength,
  type AdminTextCommand,
} from '#shared/commands';
import { LANGS, type Lang } from '#shared/i18n';
import seedCommands from '~~/prisma/seed/commands.default.json';

const props = defineProps<{
  command: AdminTextCommand;
  prefix: string;
  botLang: Lang;
  description?: string;
  // Текст у каждого канала свой: нетронутый шаблон помечается
  personal?: boolean;
  // Перечитывает эту команду из базы; false — не получилось
  reload: (name: string) => Promise<boolean>;
}>();
const emit = defineEmits<{ dirty: [name: string, value: boolean] }>();

const { act } = useAdminApi();
const busy = ref(false);

// У языка без ответов — одно пустое поле
const copy = (responses: Record<Lang, string[]>) =>
  Object.fromEntries(
    LANGS.map((lang) => [lang, responses[lang].length ? [...responses[lang]] : ['']]),
  ) as Record<Lang, string[]>;

const draft = ref(copy(props.command.responses));
const reset = () => (draft.value = copy(props.command.responses));

const dirty = computed(() => JSON.stringify(draft.value) !== JSON.stringify(copy(props.command.responses)));
watch(dirty, (value) => emit('dirty', props.command.name, value));

// Та же проверка, что на сервере
const invalid = computed(() => {
  const result = parseTextCommandUpdate({ responses: draft.value }, props.prefix);
  return result.ok ? '' : result.error;
});

const isTemplate = (lang: Lang): boolean => {
  if (!props.personal) return false;
  const template = seedCommands.find((item) => item.name === props.command.name && item.lang === lang);
  return props.command.responses[lang].some(
    (text) => text.includes('YOUR_') || template?.responses.includes(text),
  );
};

const cooldown = computed(
  () =>
    `Кулдаун ${Math.round(props.command.cooldownMs / 1000)} с, ` +
    (props.command.scope === 'user' ? 'у каждого зрителя свой' : 'общий на чат'),
);

const send = async (body: Record<string, unknown>, done: string): Promise<boolean> => {
  const url = `/api/admin/commands/${encodeURIComponent(props.command.name)}`;
  return (await act(url, body, done)) && (await props.reload(props.command.name));
};

const save = async () => {
  busy.value = true;
  if (await send({ responses: draft.value }, 'Сохранено. Бот подхватит примерно за 30 секунд')) {
    await nextTick();
    // Сервер убирает переносы строк и пустые варианты: показываем то, что легло в базу
    reset();
  }
  busy.value = false;
};

const toggle = async (enabled: boolean) => {
  busy.value = true;
  await send({ enabled }, enabled ? 'Команда включена' : 'Команда выключена');
  busy.value = false;
};
</script>

<template>
  <UCard>
    <div class="flex flex-col gap-3">
      <AdminCommandTitle :name="command.name" :aliases="command.aliases" :prefix="prefix" role="viewer">
        <UBadge v-if="dirty" color="warning" variant="subtle">не сохранено</UBadge>
        <USwitch
          :model-value="command.enabled"
          :disabled="busy"
          :label="command.enabled ? 'Включена' : 'Выключена'"
          @update:model-value="toggle"
        />
      </AdminCommandTitle>

      <p class="text-sm text-muted">{{ [description, `${cooldown}.`].filter(Boolean).join(' ') }}</p>
      <p v-if="command.mixed" class="text-sm text-warning">
        В базе на разных языках разное состояние. Переключатель сделает его одинаковым.
      </p>

      <div class="grid gap-4 lg:grid-cols-3">
        <div v-for="lang in LANGS" :key="lang" class="flex flex-col gap-2">
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-sm font-semibold text-highlighted">{{ lang }}</span>
            <UBadge v-if="lang === botLang" color="success" variant="subtle">бот отвечает на нём</UBadge>
            <UBadge v-if="isTemplate(lang)" color="warning" variant="subtle">заглушка</UBadge>
          </div>

          <div v-for="(text, index) in draft[lang]" :key="index" class="flex flex-col gap-1">
            <!-- Высоту по тексту подбирает CSS: autoresize в Nuxt UI мерит поле раньше, чем колонки встали -->
            <UTextarea
              v-model="draft[lang][index]"
              :lang="lang"
              :rows="3"
              :disabled="busy"
              :aria-label="`${prefix}${command.name}, ${lang}, вариант ${index + 1}`"
              class="w-full"
              :ui="{ base: 'field-sizing-content min-h-16 resize-y' }"
            />
            <div class="flex items-center justify-between gap-2">
              <span
                class="text-xs tabular-nums"
                :class="responseLength(text, prefix) > CHAT_MESSAGE_LIMIT ? 'text-error' : 'text-dimmed'"
              >
                {{ responseLength(text, prefix) }} / {{ CHAT_MESSAGE_LIMIT }}
              </span>
              <UButton
                v-if="draft[lang].length > 1"
                color="neutral"
                variant="ghost"
                size="xs"
                icon="i-lucide-trash-2"
                :disabled="busy"
                @click="draft[lang].splice(index, 1)"
              >
                Убрать
              </UButton>
            </div>
          </div>

          <UButton
            v-if="draft[lang].length < MAX_RESPONSES"
            color="neutral"
            variant="ghost"
            size="sm"
            icon="i-lucide-plus"
            class="self-start"
            :disabled="busy"
            @click="draft[lang].push('')"
          >
            Вариант
          </UButton>
        </div>
      </div>

      <div v-if="dirty" class="flex flex-wrap items-center gap-2">
        <UButton icon="i-lucide-save" :disabled="!!invalid" :loading="busy" @click="save">Сохранить</UButton>
        <UButton color="neutral" variant="subtle" :disabled="busy" @click="reset">Отменить</UButton>
        <span v-if="invalid" class="text-sm text-error">{{ invalid }}</span>
      </div>
    </div>
  </UCard>
</template>
