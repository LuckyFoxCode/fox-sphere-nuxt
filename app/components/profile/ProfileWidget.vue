<script setup lang="ts">
// Текущая карточка профиля из очереди: по центру кадра выше алертов, одна на 9 секунд.
const profile = useProfileStore();
</script>

<template>
  <div class="absolute top-1/4 left-1/2 -translate-x-1/2">
    <Transition name="sticker-slap">
      <ProfileCard v-if="profile.current" :key="profile.current.id" :profile="profile.current" />
    </Transition>
  </div>
</template>
