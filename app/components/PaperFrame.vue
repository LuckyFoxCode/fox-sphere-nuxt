<script setup lang="ts">
// Второй материал, «бумага»: контент, а не HUD (сообщение чата, карточка профиля). Овсяный контур 2px,
// тень и зерно из чернил — овсяные точки на светлой бумаге не видны. Саму бумагу задаёт вызывающий.
</script>

<template>
  <div
    class="relative overflow-hidden rounded-2xl border-2 border-sticker-edge font-quicksand shadow-[0_10px_24px_rgba(0,0,0,0.45)]"
  >
    <span
      aria-hidden="true"
      class="paper-grain pointer-events-none absolute inset-0 rounded-[14px]"
    />
    <slot />
  </div>
</template>

<style scoped>
/* Радиус 14 = 16 (rounded-2xl) минус 2 (border-2), иначе зерно вылезает в скруглении */
.paper-grain {
  background-image: radial-gradient(rgba(43, 38, 48, 0.14) 0.6px, transparent 0.6px);
  background-size: 3px 3px;
  opacity: 0.5;
}
</style>
