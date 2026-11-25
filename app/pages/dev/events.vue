<script setup lang="ts">
// Эмулятор событий без Twitch: кнопки шлют dev-события на сервер бота, он рассылает их оверлеям
// как настоящие. Справа — превью оверлеев. Нужен запущенный бот (pnpm dev) и DEV_EVENTS != false.
import type { ChatAnnounceColor, ChatMessagePayload } from '#shared/events';
import { buildStreamState, getStreamLevel, getXpThresholdForLevel } from '#shared/xp';

const { $socket } = useNuxtApp();
const xp = useXpStore();
const stream = useStreamStore();

// Какой оверлей показывать в превью справа
const previews = [
  { path: '/overlay/stream', label: 'Шапка' },
  { path: '/overlay/xp', label: 'XP' },
  { path: '/overlay/chat', label: 'Чат' },
] as const;
const previewPath = ref<(typeof previews)[number]['path']>('/overlay/stream');

const username = ref('TestViewer');
const lvl = ref(3);
const amount = ref(3);
const status = ref('');

const send = (
  event: 'dev:xp-gain' | 'dev:level-up' | 'dev:chat-message' | 'dev:stream-state',
  payload: unknown,
) => {
  $socket.emit(event, payload, (result) => {
    status.value = result.ok ? 'отправлено' : `отклонено: ${result.reason ?? '?'}`;
  });
};

const base = () => ({ twitchId: `dev-${username.value.toLowerCase()}`, username: username.value });

// totalXp = середина уровня, чтобы полоса была видна
const midXp = () => Math.floor((getXpThresholdForLevel(lvl.value - 1) + getXpThresholdForLevel(lvl.value)) / 2);

const gain = () =>
  send('dev:xp-gain', { ...base(), amount: amount.value, totalXp: midXp(), lvl: lvl.value });

const levelUp = () => send('dev:level-up', { ...base(), fromLvl: lvl.value, toLvl: lvl.value + 1 });

// Как настоящий уровень: полоса добирается до 100%, затем level-up
const gainWithLevelUp = () => {
  send('dev:xp-gain', {
    ...base(),
    amount: amount.value,
    totalXp: getXpThresholdForLevel(lvl.value),
    lvl: lvl.value,
  });
  send('dev:level-up', { ...base(), fromLvl: lvl.value, toLvl: lvl.value + 1 });
  lvl.value += 1;
};

const burst = () => {
  for (const [index, name] of ['Fox', 'Lynx', 'Wolf'].entries()) {
    setTimeout(() => {
      send('dev:xp-gain', {
        twitchId: `dev-${name}`,
        username: name,
        amount: 1 + index,
        totalXp: getXpThresholdForLevel(4) - 30 + index * 40,
        lvl: 5,
      });
    }, index * 800);
  }
};

// --- Стрим -----------------------------------------------------------------------------
// Считаем от того, что сейчас показывает шапка. В базу ничего не пишется.
const streamAmount = ref(500);

const sendStreamXp = (totalXp: number, lvl: number) =>
  send('dev:stream-state', buildStreamState(getStreamLevel(lvl, totalXp), totalXp));

const addStreamXp = () => {
  if (stream.state) sendStreamXp(stream.state.newXp + streamAmount.value, stream.state.lvl);
};

// Добавляет ровно столько, сколько не хватает до следующего уровня
const streamLevelUp = () => {
  if (stream.state) sendStreamXp(stream.state.maxXp, stream.state.lvl);
};

const resetStream = () => {
  $socket.emit('dev:stream-reset', (result) => {
    status.value = result.ok ? 'отправлено' : `отклонено: ${result.reason ?? '?'}`;
  });
};

// --- Чат -------------------------------------------------------------------------------
const chatText = ref('Привет, чат! Kappa');
const chatColor = ref('#ff7ab8');
const chatLvl = ref(12);
const chatRoles = reactive({
  isBroadcaster: false,
  isBot: false,
  isMod: false,
  isVip: false,
  isSubscriber: false,
  isFollower: false,
  isHighlight: false,
  isAction: false,
});
const chatRoleLabels: Record<keyof typeof chatRoles, string> = {
  isBroadcaster: 'стример',
  isBot: 'бот',
  isMod: 'модератор',
  isVip: 'VIP',
  isSubscriber: 'саб',
  isFollower: 'фолловер',
  isHighlight: 'highlight',
  isAction: '/me',
};
const chatAnnounce = ref<ChatAnnounceColor | ''>('');
const chatStreak = ref(false);

let chatSeq = 0;
const chatMessage = (over: Partial<ChatMessagePayload> = {}): ChatMessagePayload => ({
  id: `dev-chat-${Date.now()}-${chatSeq++}`,
  userId: `dev-${username.value.toLowerCase()}`,
  username: username.value.toLowerCase(),
  displayName: username.value,
  color: chatColor.value,
  text: chatText.value,
  badges: [],
  // Смайл Kappa (id 25) на месте первого слова «Kappa», если оно есть в тексте
  emotes: emotesFor(chatText.value),
  timestamp: Date.now(),
  userLvl: chatLvl.value,
  isMod: chatRoles.isMod,
  isFollower: chatRoles.isFollower,
  isFounder: false,
  isSubscriber: chatRoles.isSubscriber,
  isVip: chatRoles.isVip,
  isPermanentVip: false,
  isBroadcaster: chatRoles.isBroadcaster,
  isBot: chatRoles.isBot,
  isHighlight: chatRoles.isHighlight,
  isAction: chatRoles.isAction,
  ...(chatAnnounce.value ? { isAnnouncement: true, announceColor: chatAnnounce.value } : {}),
  ...(chatStreak.value ? { watchStreak: { value: 5, reward: 500 } } : {}),
  ...over,
});

const emotesFor = (text: string): Record<string, string[]> => {
  const emotes: Record<string, string[]> = {};
  for (const [name, id] of [['Kappa', '25'], ['LUL', '425618'], ['PogChamp', '305954156']] as const) {
    for (const match of text.matchAll(new RegExp(`\\b${name}\\b`, 'g'))) {
      const start = match.index ?? 0;
      (emotes[id] ??= []).push(`${start}-${start + name.length - 1}`);
    }
  }
  return emotes;
};

const sendChat = () => send('dev:chat-message', chatMessage());

// По одному сообщению от каждой роли: видно рамку, медаль и плашку каждого типа
const ROLE_SAMPLES: [string, number, Partial<ChatMessagePayload>][] = [
  ['Streamer', 100, { isBroadcaster: true }],
  ['SysBot', 1, { isBot: true }],
  ['ModMike', 45, { isMod: true }],
  ['VipVera', 33, { isVip: true }],
  ['SubSam', 22, { isSubscriber: true }],
  ['FollowFin', 8, { isFollower: true }],
  ['Viewer', 2, {}],
];
const chatRolesBurst = () => {
  ROLE_SAMPLES.forEach(([name, lvl, flags], index) => {
    setTimeout(() => {
      send(
        'dev:chat-message',
        chatMessage({
          id: `dev-chat-${Date.now()}-${chatSeq++}`,
          userId: `dev-${name.toLowerCase()}`,
          username: name.toLowerCase(),
          displayName: name,
          userLvl: lvl,
          text: `Сообщение роли ${name} Kappa`,
          emotes: emotesFor(`Сообщение роли ${name} Kappa`),
          isMod: false,
          isVip: false,
          isSubscriber: false,
          isFollower: false,
          isBroadcaster: false,
          isBot: false,
          ...flags,
        }),
      );
    }, index * 500);
  });
};

// Семь подряд: проверка лимита в 5 сообщений и ухода старых вниз
const chatSpam = () => {
  for (let i = 1; i <= 7; i++) {
    setTimeout(() => send('dev:chat-message', chatMessage({ text: `Сообщение №${i} LUL`, emotes: emotesFor(`Сообщение №${i} LUL`) })), i * 300);
  }
};

const chatLongLink = () =>
  send(
    'dev:chat-message',
    chatMessage({ text: 'Смотрите https://github.com/LuckyFoxCode/fox-sphere-nuxt, очень_длинное_слово_без_пробелов_чтобы_проверить_перенос_строки' , emotes: {} }),
  );

onMounted(() => $socket.connect());
onBeforeUnmount(() => $socket.disconnect());

// Превью 1920×1080, уменьшенное под ширину блока
const box = ref<HTMLElement>();
const scale = ref(0.4);
onMounted(() => {
  const observer = new ResizeObserver(([entry]) => {
    if (entry) scale.value = entry.contentRect.width / 1920;
  });
  if (box.value) observer.observe(box.value);
  onBeforeUnmount(() => observer.disconnect());
});

const connectionLabel = { connecting: 'подключаюсь…', connected: 'подключён', disconnected: 'нет связи' };
</script>

<template>
  <main class="min-h-screen bg-sticker-well p-6 font-quicksand text-sticker-ink">
    <h1 class="text-2xl font-bold">Эмулятор событий</h1>
    <p class="mt-1 text-sm text-sticker-muted">
      Сокет: {{ connectionLabel[xp.connection] }}. Бот должен быть запущен (<code>pnpm dev</code>).
    </p>

    <div class="mt-5 flex flex-wrap gap-x-8 gap-y-6">
      <section class="flex w-80 flex-col gap-y-3">
        <h2 class="text-lg font-bold">Стрим</h2>
        <p class="text-sm text-sticker-muted tabular-nums">
          {{ stream.state ? `Уровень ${stream.state.lvl}, ${stream.state.newXp} / ${stream.state.maxXp} XP` : 'Состояние ещё не получено' }}.
          База не меняется.
        </p>
        <label class="flex flex-col gap-y-1 text-xs font-bold tracking-widest text-sticker-muted uppercase">
          XP стрима за нажатие
          <input v-model.number="streamAmount" type="number" min="1" class="rounded-lg bg-sticker-track px-3 py-2 text-base text-sticker-ink" />
        </label>
        <button class="rounded-lg bg-sticker-edge px-3 py-2 font-bold text-sticker-body" @click="addStreamXp">Добавить XP стрима</button>
        <button class="rounded-lg bg-sticker-edge px-3 py-2 font-bold text-sticker-body" @click="streamLevelUp">Повысить уровень стрима</button>
        <button class="rounded-lg bg-sticker-track px-3 py-2 font-bold" @click="resetStream">Вернуть значения из базы</button>

        <h2 class="mt-4 text-lg font-bold">XP зрителя</h2>
        <label class="flex flex-col gap-y-1 text-xs font-bold tracking-widest text-sticker-muted uppercase">
          Ник
          <input v-model="username" class="rounded-lg bg-sticker-track px-3 py-2 text-base text-sticker-ink normal-case" />
        </label>
        <label class="flex flex-col gap-y-1 text-xs font-bold tracking-widest text-sticker-muted uppercase">
          Уровень (до события)
          <input v-model.number="lvl" type="number" min="1" class="rounded-lg bg-sticker-track px-3 py-2 text-base text-sticker-ink" />
        </label>
        <label class="flex flex-col gap-y-1 text-xs font-bold tracking-widest text-sticker-muted uppercase">
          XP за сообщение
          <input v-model.number="amount" type="number" min="1" class="rounded-lg bg-sticker-track px-3 py-2 text-base text-sticker-ink" />
        </label>
        <button class="rounded-lg bg-sticker-edge px-3 py-2 font-bold text-sticker-body" @click="gain">+XP</button>
        <button class="rounded-lg bg-sticker-edge px-3 py-2 font-bold text-sticker-body" @click="levelUp">Только level up</button>
        <button class="rounded-lg bg-sticker-edge px-3 py-2 font-bold text-sticker-body" @click="gainWithLevelUp">+XP и level up (как в бою)</button>
        <button class="rounded-lg bg-sticker-track px-3 py-2 font-bold" @click="burst">Серия от трёх зрителей</button>

        <h2 class="mt-4 text-lg font-bold">Чат</h2>
        <label class="flex flex-col gap-y-1 text-xs font-bold tracking-widest text-sticker-muted uppercase">
          Текст (Kappa, LUL, PogChamp станут смайлами)
          <input v-model="chatText" class="rounded-lg bg-sticker-track px-3 py-2 text-base text-sticker-ink normal-case" />
        </label>
        <div class="flex gap-x-3">
          <label class="flex flex-1 flex-col gap-y-1 text-xs font-bold tracking-widest text-sticker-muted uppercase">
            Цвет ника
            <input v-model="chatColor" type="color" class="h-10 w-full rounded-lg bg-sticker-track" />
          </label>
          <label class="flex flex-1 flex-col gap-y-1 text-xs font-bold tracking-widest text-sticker-muted uppercase">
            Уровень
            <input v-model.number="chatLvl" type="number" min="1" class="rounded-lg bg-sticker-track px-3 py-2 text-base text-sticker-ink" />
          </label>
        </div>
        <div class="flex flex-wrap gap-x-4 gap-y-1">
          <label v-for="(label, key) in chatRoleLabels" :key="key" class="flex items-center gap-x-1.5 text-sm">
            <input v-model="chatRoles[key]" type="checkbox" />
            {{ label }}
          </label>
        </div>
        <div class="flex items-center gap-x-3 text-sm">
          <label class="flex items-center gap-x-1.5">
            Announcement
            <select v-model="chatAnnounce" class="rounded bg-sticker-track px-2 py-1">
              <option value="">нет</option>
              <option value="blue">blue</option>
              <option value="green">green</option>
              <option value="orange">orange</option>
              <option value="purple">purple</option>
            </select>
          </label>
          <label class="flex items-center gap-x-1.5"><input v-model="chatStreak" type="checkbox" /> watch streak</label>
        </div>
        <button class="rounded-lg bg-sticker-edge px-3 py-2 font-bold text-sticker-body" @click="sendChat">Отправить сообщение</button>
        <button class="rounded-lg bg-sticker-track px-3 py-2 font-bold" @click="chatRolesBurst">По сообщению от каждой роли</button>
        <button class="rounded-lg bg-sticker-track px-3 py-2 font-bold" @click="chatSpam">Семь подряд (лимит 5)</button>
        <button class="rounded-lg bg-sticker-track px-3 py-2 font-bold" @click="chatLongLink">Ссылка и длинное слово</button>
        <p class="text-sm text-sticker-muted">{{ status }}</p>
      </section>

      <section class="min-w-[24rem] flex-1">
        <div class="mb-2 flex gap-x-2">
          <button
            v-for="preview in previews"
            :key="preview.path"
            class="rounded-lg px-3 py-1 text-sm font-bold"
            :class="previewPath === preview.path ? 'bg-sticker-edge text-sticker-body' : 'bg-sticker-track'"
            @click="previewPath = preview.path"
          >
            {{ preview.label }}
          </button>
        </div>
        <div ref="box" class="relative w-full overflow-hidden rounded-xl border-2 border-sticker-edge checker" :style="{ height: `${1080 * scale}px` }">
          <iframe
            :key="previewPath"
            :src="previewPath"
            class="absolute top-0 left-0 origin-top-left border-0"
            :style="{ width: '1920px', height: '1080px', transform: `scale(${scale})` }"
          />
        </div>
      </section>
    </div>
  </main>
</template>

<style scoped>
.checker {
  background-color: #3a3440;
  background-image:
    linear-gradient(45deg, #2f2a35 25%, transparent 25%, transparent 75%, #2f2a35 75%),
    linear-gradient(45deg, #2f2a35 25%, transparent 25%, transparent 75%, #2f2a35 75%);
  background-size: 24px 24px;
  background-position: 0 0, 12px 12px;
}
</style>
