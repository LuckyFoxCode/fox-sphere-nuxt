<script setup lang="ts">
// Лидерборд за награду «Flex Leaderboard» в стиле «графитовых наклеек», как музыка и магазин: топ по XP,
// строка активировавшего подсвечена, а если он вне топа — отдельной строкой снизу с настоящим местом.
// Шрифты крупные: на стриме карточку читают с экрана телефона.
import type { LeaderboardEntryPayload, LeaderboardShowPayload } from '#shared/events';

const props = defineProps<{ board: LeaderboardShowPayload }>();

const formatNumber = (value: number): string => value.toLocaleString('en-US');

type Row = LeaderboardEntryPayload & { mine: boolean };
const rows = computed<Row[]>(() =>
  props.board.entries.map((entry) => ({ ...entry, mine: entry.userId === props.board.requesterId })),
);
const you = computed<Row | null>(() => (props.board.you ? { ...props.board.you, mine: true } : null));

// Кубки у тройки: золото, серебро, бронза; у остальных места цифрой. Золото и бронза чуть темнее
// палитры наклеек, иначе на графите три кубка не отличить друг от друга
const TROPHY_COLORS: Record<number, string> = {
  1: 'text-amber-300',
  2: 'text-slate-300',
  3: 'text-orange-400',
};
const trophyClass = (rank: number): string | undefined => TROPHY_COLORS[rank];
const PLACE_WORDS: Record<number, string> = { 1: '1st', 2: '2nd', 3: '3rd' };
const placeWord = (rank: number): string => PLACE_WORDS[rank] ?? `${rank}th`;
</script>

<template>
  <StickerFrame class="w-96 flex-col items-stretch gap-y-3 px-4 pt-3 pb-4">
    <div class="flex items-baseline justify-between gap-x-3">
      <span class="text-xl font-bold tracking-wide uppercase">leaderboard</span>
      <span class="text-xs font-bold tracking-[0.17em] text-sticker-muted uppercase">top xp</span>
    </div>

    <ol class="flex flex-col gap-y-1.5">
      <li
        v-for="row in rows"
        :key="row.userId"
        class="flex items-center gap-x-3 rounded-lg px-2 py-1.5"
        :class="row.mine ? 'bg-sticker-track outline-2 -outline-offset-2 outline-sticker-mint' : 'bg-sticker-well'"
      >
        <span
          class="flex size-9 shrink-0 items-center justify-center"
          :aria-label="placeWord(row.rank)"
        >
          <svg
            v-if="trophyClass(row.rank)"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
            class="size-8"
            :class="trophyClass(row.rank)"
          >
            <path d="M7 3h10v2h3a1 1 0 0 1 1 1v1a5 5 0 0 1-4.2 4.93A5.01 5.01 0 0 1 13 14.9V17h3v2h1.5v2h-11v-2H8v-2h3v-2.1a5.01 5.01 0 0 1-3.8-2.97A5 5 0 0 1 3 7V6a1 1 0 0 1 1-1h3V3Zm-1.98 4.01c.2 1.4 1.1 2.4 2.1 2.8A7 7 0 0 1 7 7.5V7H5.02Zm13.96 0H17v.5c0 .93-.13 1.84-.12 2.31 1-.4 1.9-1.4 2.1-2.81Z" />
          </svg>
          <span
            v-else
            class="flex size-8 items-center justify-center rounded-md bg-sticker-track text-base font-bold tabular-nums"
          >
            {{ row.rank }}
          </span>
        </span>
        <span class="min-w-0 flex-1 truncate text-lg font-bold">{{ row.username }}</span>
        <span class="flex shrink-0 flex-col items-end leading-none">
          <span class="text-base font-bold tabular-nums">lvl {{ row.lvl }}</span>
          <span class="text-xs font-semibold text-sticker-muted tabular-nums">{{ formatNumber(row.xp) }} xp</span>
        </span>
      </li>
      <li
        v-if="rows.length === 0"
        class="rounded-lg bg-sticker-well px-2 py-3 text-center text-base font-semibold text-sticker-muted"
      >
        nobody here yet
      </li>
    </ol>

    <template v-if="you">
      <div
        aria-hidden="true"
        class="flex justify-center gap-x-1.5"
      >
        <span
          v-for="dot in 3"
          :key="dot"
          class="size-1 rounded-full bg-sticker-muted"
        />
      </div>
      <div
        class="flex items-center gap-x-3 rounded-lg bg-sticker-track px-2 py-1.5 outline-2 -outline-offset-2 outline-sticker-mint"
      >
        <span
          class="flex h-8 min-w-8 shrink-0 items-center justify-center rounded-md bg-sticker-mint px-1.5 text-base font-bold text-sticker-body tabular-nums"
        >
          {{ you.rank }}
        </span>
        <span class="min-w-0 flex-1 truncate text-lg font-bold">{{ you.username }}</span>
        <span class="flex shrink-0 flex-col items-end leading-none">
          <span class="text-base font-bold tabular-nums">lvl {{ you.lvl }}</span>
          <span class="text-xs font-semibold text-sticker-muted tabular-nums">{{ formatNumber(you.xp) }} xp</span>
        </span>
      </div>
    </template>
  </StickerFrame>
</template>
