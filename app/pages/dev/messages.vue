<script setup lang="ts">
// Все фразы бота на трёх языках рядом, с примерами значений: для проверки переводов.
import { BOT_LANG, LANGS, MESSAGES, type Lang } from '#shared/i18n';
import textCommands from '~~/prisma/seed/commands.default.json';
import { PHRASE_NAME, phraseSections, type PhraseRow, type PhraseSection } from '~/utils/botPhrases';

const PREFIX = '!';

// Простые команды лежат не в словарях, а в базе; здесь показан шаблон, которым её заполняет сид
const textResponse = (name: string, lang: Lang, index: number) =>
  textCommands
    .find((command) => command.name === name && command.lang === lang)
    ?.responses[index]?.replaceAll('{user}', PHRASE_NAME)
    .replaceAll('{prefix}', PREFIX)
    .replaceAll('{version}', '0.1.0') ?? '— нет перевода';

const TEXT_ROWS: PhraseRow[] = textCommands
  .filter((command) => command.lang === 'en')
  .flatMap(({ name, responses }) =>
    responses.map((_, index): PhraseRow => [
      responses.length > 1 ? `!${name} ${index + 1}` : `!${name}`,
      (_t, lang) => textResponse(name, lang, index),
    ]),
  );

const SECTIONS: PhraseSection[] = [
  ...phraseSections(PREFIX),
  {
    title: 'Текстовые команды',
    description: 'Из шаблона prisma/seed/commands.default.json. В базе тексты могут отличаться: сид не трогает записи, которые там уже есть.',
    rows: TEXT_ROWS,
  },
];
</script>

<template>
  <main class="min-h-screen bg-sticker-well p-6 font-quicksand text-sticker-ink">
    <h1 class="text-2xl font-bold">Фразы бота</h1>
    <p class="mt-1 text-sm text-sticker-muted">
      Сейчас бот отвечает на <code>{{ BOT_LANG }}</code> (<code>BOT_LANG</code> в <code>shared/i18n/index.ts</code>).
      Тексты — в файлах <code>shared/i18n/</code>, текстовые команды — в базе (внизу страницы).
      <NuxtLink class="underline" to="/dev/events">Эмулятор событий</NuxtLink>
    </p>

    <section v-for="section in SECTIONS" :key="section.title" class="mt-10">
      <h2 class="text-xl font-bold">{{ section.title }}</h2>
      <p class="mt-1 text-sm text-sticker-muted">{{ section.description }}</p>
      <div class="mt-3 flex flex-col gap-y-2">
        <article v-for="[label, render] in section.rows" :key="label" class="rounded-lg bg-sticker-track p-3">
          <h3 class="text-sm leading-6 font-bold"><CommandLabel :text="label" /></h3>
          <div class="mt-2 grid gap-x-4 gap-y-1 lg:grid-cols-3">
            <p v-for="lang in LANGS" :key="lang" :lang="lang" class="text-sm">
              <span class="mr-2 text-sticker-muted">{{ lang }}</span>{{ render(MESSAGES[lang], lang) }}
            </p>
          </div>
        </article>
      </div>
    </section>
  </main>
</template>
