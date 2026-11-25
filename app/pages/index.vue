<script setup lang="ts">
// Главная: навигатор по оверлеям (список в utils/overlays.ts). В OBS не добавляется.
// useRequestURL даёт один и тот же origin на сервере и в браузере.
const { origin } = useRequestURL();

useHead({ title: 'fox-sphere', bodyAttrs: { class: 'bg-bg' } });

// Путь оверлея, по которому нажали «Скопировать», и чем это закончилось
const copied = ref<{ path: string; ok: boolean } | null>(null);
let resetTimer: ReturnType<typeof setTimeout> | undefined;

const copy = async (path: string) => {
  let ok = true;
  try {
    // Вне localhost по http буфер обмена недоступен — тогда попадём в catch
    await navigator.clipboard.writeText(origin + path);
  } catch {
    ok = false;
  }
  copied.value = { path, ok };
  clearTimeout(resetTimer);
  resetTimer = setTimeout(() => (copied.value = null), 2000);
};

const copyLabel = (path: string) => {
  if (copied.value?.path !== path) return 'Скопировать';
  return copied.value.ok ? 'Скопировано' : 'Не вышло';
};

onBeforeUnmount(() => clearTimeout(resetTimer));
</script>

<template>
  <div class="min-h-screen bg-bg text-text-main">
    <main class="mx-auto max-w-3xl px-4 py-10">
      <h1 class="text-2xl font-bold">fox-sphere</h1>
      <p class="mt-2 text-text-second">
        Оверлеи для OBS. Добавьте источник «Браузер», вставьте адрес и задайте указанный размер.
      </p>

      <ul class="mt-8 space-y-4">
        <li v-for="overlay in OVERLAYS" :key="overlay.path" class="rounded-lg border border-line bg-card p-4">
          <div class="flex flex-wrap items-baseline justify-between gap-2">
            <h2 class="text-lg font-semibold">{{ overlay.title }}</h2>
            <span class="text-sm text-text-second">{{ overlay.width }}×{{ overlay.height }}</span>
          </div>
          <p class="mt-1 text-sm text-text-second">{{ overlay.description }}</p>
          <div class="mt-3 flex flex-wrap items-center gap-2">
            <code class="min-w-0 grow basis-64 rounded border border-line bg-bg px-3 py-2 text-sm break-all select-all">{{
              origin + overlay.path
            }}</code>
            <button
              type="button"
              class="w-32 cursor-pointer rounded border border-line py-2 text-sm hover:bg-line"
              @click="copy(overlay.path)"
            >
              {{ copyLabel(overlay.path) }}
            </button>
            <a class="px-2 py-2 text-sm text-link hover:underline" :href="overlay.path" target="_blank">Открыть</a>
          </div>
        </li>
      </ul>

      <section class="mt-10 border-t border-line pt-6">
        <h2 class="text-lg font-semibold">Инструменты</h2>
        <p class="mt-2 text-sm text-text-second">
          <NuxtLink class="text-link hover:underline" to="/dev/events">Эмулятор событий</NuxtLink>
          — проверка виджетов без Twitch. Нужен запущенный бот, в prod по умолчанию выключен. События видит и OBS.
        </p>
      </section>
    </main>
  </div>
</template>
