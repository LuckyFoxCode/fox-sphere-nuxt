<script setup lang="ts">
// Окно магазина по команде !shop: по центру экрана. Пока оно на сцене, рулетка и лотерея ждут своей очереди
// в самом магазине (см. stores/shop.ts), а карточка профиля - наоборот, магазин ждёт её.
const shop = useShopStore();
</script>

<template>
  <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
    <Transition
      name="sticker-slap"
      mode="out-in"
    >
      <ShopWindow
        v-if="shop.current"
        :key="shop.current.id"
        :shop="shop.current"
      />
    </Transition>
  </div>
</template>
