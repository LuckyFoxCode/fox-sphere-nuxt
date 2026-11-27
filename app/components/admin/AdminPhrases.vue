<script setup lang="ts">
// Фразы команд из кода на трёх языках с примерами значений. Только чтение: лежат в shared/i18n.
import { LANGS, MESSAGES, type Lang } from '#shared/i18n';
import type { PhraseSection } from '~/utils/botPhrases';

const props = defineProps<{ section: PhraseSection; prefix: string; botLang: Lang }>();

// Команды в подписи строки получают настоящий префикс и выделяются плашкой
const rows = computed(() =>
  props.section.rows.map(([label, render]) => ({
    label,
    render,
    parts: label
      .replace(/!(?=[a-z])/g, props.prefix)
      .split(/(![a-z]+)/)
      .filter(Boolean),
  })),
);
</script>

<template>
  <UCollapsible class="flex flex-col gap-2">
    <UButton
      color="neutral"
      variant="subtle"
      class="self-start"
      icon="i-lucide-message-square-text"
      trailing-icon="i-lucide-chevron-down"
    >
      Фразы бота: {{ rows.length }}, только чтение
    </UButton>
    <template #content>
      <div class="flex flex-col divide-y divide-default rounded-lg border border-default">
        <article v-for="row in rows" :key="row.label" class="p-3">
          <h4 class="text-sm font-semibold text-highlighted">
            <template v-for="(part, index) in row.parts" :key="index">
              <UBadge v-if="part.startsWith('!')" color="primary" variant="subtle" class="font-mono">{{ part }}</UBadge>
              <template v-else>{{ part }}</template>
            </template>
          </h4>
          <div class="mt-2 grid gap-x-4 gap-y-1 lg:grid-cols-3">
            <p v-for="lang in LANGS" :key="lang" :lang="lang" class="text-sm">
              <span class="mr-2" :class="lang === botLang ? 'text-success' : 'text-dimmed'">{{ lang }}</span
              >{{ row.render(MESSAGES[lang], lang) }}
            </p>
          </div>
        </article>
      </div>
    </template>
  </UCollapsible>
</template>
