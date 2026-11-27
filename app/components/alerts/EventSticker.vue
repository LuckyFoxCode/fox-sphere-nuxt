<script setup lang="ts">
// Одно событие на стриме (DESIGN.md 4.5): графитовое тело, слева пластина из бумаги события со знаком,
// посередине колонка с текстом и графитовыми чипами, справа при необходимости плитка с крупным числом
// (так стикер не растёт в высоту). Цвет на стикере один — бумага пластины.
import type { Component } from 'vue';

const props = defineProps<{
  paper: string;
  /** Значок на пластине; не нужен, когда её занял арт */
  icon?: Component;
  /** Вид алерта: от него зависит анимация значка при входе */
  motion?: string;
  /** Арт достижения: занимает пластину целиком, как марка на паспарту */
  media?: { src: string; alt: string };
  /** Овсяный чип в углу: флаг («new tier»), а не факт */
  tag?: string;
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
    <div
      class="plate relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl text-sticker-body"
      :class="[paper, media ? 'size-28 p-1' : 'size-12', icon && motion ? `plate-${motion}` : '']"
    >
      <img v-if="media" :src="media.src" :alt="media.alt" class="size-full object-contain" />
      <component :is="icon" v-else-if="icon" aria-hidden="true" class="plate-icon size-8" />
    </div>

    <div class="flex min-w-0 flex-1 flex-col">
      <div class="flex items-start justify-between gap-x-2">
        <span class="text-[10px] leading-none font-bold tracking-[0.17em] text-sticker-muted uppercase">
          {{ label }}
        </span>
        <span
          v-if="tag"
          class="-mt-0.5 shrink-0 rounded-md bg-sticker-edge px-1.5 py-0.5 text-[10px] leading-none font-bold tracking-[0.12em] text-sticker-body uppercase"
        >
          {{ tag }}
        </span>
      </div>
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
