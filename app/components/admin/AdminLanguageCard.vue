<script setup lang="ts">
// Язык ответов бота: выбор сразу сохраняется в базу, бот перечитывает его раз в несколько секунд.
import { LANGS, type Lang } from '#shared/i18n';

const props = defineProps<{ current: Lang | null }>();
const emit = defineEmits<{ changed: [] }>();

const NAMES: Record<Lang, string> = { en: 'English', uk: 'Українська', ru: 'Русский' };

const { act } = useAdminApi();
const saving = ref<Lang | null>(null);

const choose = async (botLang: Lang) => {
  if (botLang === props.current) return;
  saving.value = botLang;
  if (await act('/api/admin/settings', { botLang }, `Бот переключится на ${NAMES[botLang]} за несколько секунд`)) {
    emit('changed');
  }
  saving.value = null;
};
</script>

<template>
  <UCard>
    <template #header>
      <h2 class="text-lg font-semibold text-highlighted">Язык бота</h2>
    </template>

    <div class="flex flex-col gap-4">
      <div class="flex flex-wrap gap-2" role="group" aria-label="Язык ответов бота">
        <UButton
          v-for="lang in LANGS"
          :key="lang"
          size="xl"
          :color="current === lang ? 'primary' : 'neutral'"
          :variant="current === lang ? 'solid' : 'subtle'"
          :icon="current === lang ? 'i-lucide-check' : undefined"
          :aria-pressed="current === lang"
          :disabled="current === null || saving !== null"
          :loading="saving === lang"
          :lang="lang"
          @click="choose(lang)"
        >
          {{ NAMES[lang] }}
        </UButton>
      </div>
      <p class="text-sm text-muted">
        На этом языке бот пишет в чат, отвечает на текстовые команды и подписывает алерт сундука и сцену лотереи. Сами
        тексты команд правятся в разделе
        <ULink to="/admin/commands" class="text-primary underline">«Команды»</ULink>.
      </p>
    </div>
  </UCard>
</template>
