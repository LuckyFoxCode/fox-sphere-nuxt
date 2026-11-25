<script setup lang="ts">
// Одно событие на стриме (DESIGN.md 4.5): графитовое тело, слева пластина из бумаги события со знаком,
// посередине колонка с текстом и графитовыми чипами, справа при необходимости плитка с крупным числом
// (так стикер не растёт в высоту). Цвет на стикере один — бумага пластины.
import type { Component } from 'vue';

const props = defineProps<{
  paper: string;
  icon: Component;
  label: string;
  title: string;
  detail?: string;
  stat?: { value: string; unit: string };
  chips?: string[];
}>();

const ariaLabel = computed(() =>
  [
    props.label,
    props.title,
    props.stat && `${props.stat.value} ${props.stat.unit}`,
    props.detail,
    ...(props.chips ?? []),
  ]
    .filter(Boolean)
    .join(' — '),
);
</script>

<template>
  <StickerFrame role="status" :aria-label="ariaLabel" class="w-105 gap-x-3 py-2.5 pr-3 pl-2.5">
    <div class="flex size-12 shrink-0 items-center justify-center rounded-xl text-sticker-body" :class="paper">
      <component :is="icon" aria-hidden="true" class="size-8" />
    </div>

    <div class="flex min-w-0 flex-1 flex-col">
      <span class="text-[10px] leading-none font-bold tracking-[0.17em] text-sticker-muted uppercase">
        {{ label }}
      </span>
      <span class="mt-1.5 truncate text-xl leading-tight font-bold">{{ title }}</span>
      <span v-if="detail" class="mt-1 truncate text-sm leading-tight font-medium text-sticker-muted">
        {{ detail }}
      </span>
      <div v-if="chips?.length" class="mt-2 flex flex-wrap gap-1.5">
        <span
          v-for="chip in chips"
          :key="chip"
          class="max-w-full truncate rounded-md bg-sticker-track px-1.5 py-1 text-xs leading-none font-bold"
        >
          {{ chip }}
        </span>
      </div>
    </div>

    <div v-if="stat" class="flex min-w-18 shrink-0 flex-col items-center gap-y-1 rounded-xl bg-sticker-track px-2.5 py-2">
      <span class="text-3xl leading-none font-bold tabular-nums">{{ stat.value }}</span>
      <span class="text-[10px] leading-none font-bold tracking-[0.17em] text-sticker-muted uppercase">
        {{ stat.unit }}
      </span>
    </div>
  </StickerFrame>
</template>
