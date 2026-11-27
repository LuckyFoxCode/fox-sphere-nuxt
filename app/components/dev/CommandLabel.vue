<script setup lang="ts">
// Подпись строки на странице фраз: команды в ней (`!coins`, `!buy`) выделяются цветной плашкой.
const props = defineProps<{ text: string }>();

// Скобки в выражении оставляют сами команды в результате split
const parts = computed(() => props.text.split(/(![a-z]+)/).filter(Boolean));
</script>

<template>
  <template v-for="(part, index) in parts" :key="index">
    <code v-if="part.startsWith('!')" class="rounded-md bg-paper-amber px-2 py-0.5 font-bold text-sticker-well">{{
      part
    }}</code>
    <template v-else>{{ part }}</template>
  </template>
</template>
