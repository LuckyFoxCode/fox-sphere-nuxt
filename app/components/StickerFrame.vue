<script setup lang="ts">
// Основа всех HUD-виджетов: графит, овсяный контур 2px, одна смещённая тень, бумажное зерно.
</script>

<template>
  <div
    class="sticker-frame relative flex items-center rounded-2xl border-2 border-sticker-edge bg-sticker-body font-quicksand text-sticker-ink shadow-[0_10px_24px_rgba(0,0,0,0.45)]"
  >
    <slot />
  </div>
</template>

<style scoped>
.sticker-frame::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 14px;
  pointer-events: none;
  background-image: radial-gradient(var(--sticker-edge) 0.6px, transparent 0.6px);
  background-size: 3px 3px;
  opacity: 0.12;
}
</style>
