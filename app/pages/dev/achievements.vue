<script setup lang="ts">
// Превью ачивок: все значки по ступеням, пример карточки профиля и кнопка «отправить на оверлей»
// (событие dev:profile, нужен запущенный бот с DEV_EVENTS). В базу ничего не пишет.
import { ACHIEVEMENT_CATEGORIES } from '#shared/achievements';
import type { ProfileShowPayload } from '#shared/events';
import { achievementRarityLabel } from '~/utils/achievements';
import { PROFILE_SAMPLE, PROFILE_SPARSE } from '~/utils/profileSample';

useHead({ title: 'Ачивки: превью' });

const { $socket } = useNuxtApp();
const status = ref('');
onMounted(() => $socket.connect());
onBeforeUnmount(() => $socket.disconnect());

const RARITIES = [1, 2, 3, 4, 5];
const iconCategories = ACHIEVEMENT_CATEGORIES.filter((category) => !category.art);

const sample = PROFILE_SAMPLE;
const sparse = PROFILE_SPARSE;

const send = (payload: ProfileShowPayload) => {
  $socket.emit('dev:profile', payload, (result) => {
    status.value = result.ok ? 'отправлено' : `отклонено: ${result.reason ?? '?'}`;
  });
};
</script>

<template>
  <main class="min-h-screen bg-bg px-8 py-7 font-quicksand text-sticker-ink">
    <h1 class="text-2xl font-bold">Ачивки: превью</h1>

    <section class="mt-6">
      <h2 class="mb-3 text-lg font-bold">Значки по ступеням (SVG)</h2>
      <div class="grid w-fit grid-cols-[auto_repeat(5,7rem)] items-center gap-x-4 gap-y-3">
        <span />
        <span v-for="rarity in RARITIES" :key="rarity" class="text-center text-xs font-bold text-sticker-muted">
          {{ rarity }} · {{ achievementRarityLabel(rarity) }}
        </span>
        <template v-for="category in iconCategories" :key="category.id">
          <span class="text-sm font-bold">{{ category.title }}</span>
          <AchievementIcon v-for="rarity in RARITIES" :key="rarity" :category="category.id" :rarity="rarity" class="size-28" />
        </template>
      </div>
    </section>

    <section class="mt-8">
      <h2 class="mb-3 text-lg font-bold">Карточка профиля</h2>
      <div class="flex flex-wrap items-start gap-6">
        <ProfileCard :profile="sample" />
        <ProfileCard :profile="sparse" />
      </div>
      <div class="mt-4 flex items-center gap-3">
        <button class="rounded-lg bg-sticker-track px-3 py-2 font-bold" @click="send(sample)">Показать на оверлее: полная</button>
        <button class="rounded-lg bg-sticker-track px-3 py-2 font-bold" @click="send(sparse)">Показать на оверлее: новичок</button>
        <span class="text-sm text-sticker-muted">{{ status }}</span>
      </div>
    </section>
  </main>
</template>
