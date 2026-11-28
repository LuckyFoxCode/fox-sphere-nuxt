<script setup lang="ts">
// Полоска здоровья: заливка уходит быстро, светлый «хвост» за ней догоняет медленнее, как в файтингах.
// Цифры лежат внутри полоски с тёмной обводкой букв: читаются и на заливке, и на пустой части.
const props = defineProps<{ value: number; max: number; name: string; align: 'left' | 'right' }>();

const pct = computed(() => (props.max > 0 ? Math.max(0, Math.min(100, (props.value / props.max) * 100)) : 0));
const color = computed(() => (pct.value > 55 ? 'var(--sticker-mint)' : pct.value > 25 ? '#e6b450' : 'var(--sticker-rose)'));
</script>

<template>
  <div
    class="font-quicksand flex w-52 flex-col gap-1.5"
    :class="align === 'right' ? 'items-end text-right' : 'items-start text-left'"
  >
    <div class="max-w-full truncate text-[15px] leading-none font-extrabold text-sticker-ink [text-shadow:0_1px_3px_rgba(0,0,0,0.85)]">
      {{ name }}
    </div>
    <div class="relative h-5 w-full overflow-hidden rounded-full border-2 border-sticker-edge bg-sticker-well">
      <div
        class="hp-lag absolute inset-y-0 left-0 bg-white/60"
        :style="{ width: pct + '%' }"
      />
      <div
        class="hp-fill absolute inset-y-0 left-0"
        :style="{ width: pct + '%', background: color }"
      />
      <div class="hp-text absolute inset-0 flex items-center justify-center text-xs leading-none font-extrabold text-white">
        {{ Math.ceil(value) }} / {{ Math.round(max) }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.hp-fill {
  transition: width 220ms ease-out, background-color 300ms;
}
.hp-lag {
  transition: width 900ms ease-in 350ms;
}
.hp-text {
  -webkit-text-stroke: 3px #1b1620;
  paint-order: stroke fill;
  letter-spacing: 0.02em;
}
</style>
