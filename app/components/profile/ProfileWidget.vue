<script setup lang="ts">
// Текущая карточка профиля из очереди: справа, как в старом fox-sphere, одна на 9 секунд.
const profile = useProfileStore();
</script>

<template>
  <div class="absolute right-[20%] bottom-[35%]">
    <Transition
      name="profile-slide"
      mode="out-in"
    >
      <ProfileCard
        v-if="profile.current"
        :key="profile.current.id"
        :profile="profile.current"
      />
    </Transition>
  </div>
</template>
