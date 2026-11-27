<script setup lang="ts">
// Текущая карточка лидерборда из очереди: слева от центра, одна на 9 секунд.
const leaderboard = useLeaderboardStore();
</script>

<template>
  <div class="absolute bottom-[35%] left-[26%]">
    <Transition
      name="sticker-slap"
      mode="out-in"
    >
      <LeaderboardCard
        v-if="leaderboard.current"
        :key="leaderboard.current.id"
        :board="leaderboard.current"
      />
    </Transition>
  </div>
</template>
