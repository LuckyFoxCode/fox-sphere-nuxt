import { defineStore } from 'pinia';
import type { LotteryDrawPayload, LotteryParticipantsPayload } from '#shared/events';
import {
  LOTTERY_DRAW_MS,
  LOTTERY_FINALE_MS,
  LOTTERY_GAP_MS,
  LOTTERY_INTRO_MS,
  LOTTERY_PARTICIPANTS_SHOW_MS,
  lotteryReelMs,
} from '#shared/lottery';

// intro — заставка и пустые барабаны; draw — барабаны крутятся и встают; finale — список победителей
export type LotteryPhase = 'intro' | 'draw' | 'finale';

export type ActiveLottery =
  | { id: number; kind: 'draw'; payload: LotteryDrawPayload }
  | { id: number; kind: 'participants'; payload: LotteryParticipantsPayload };

// Сколько прогонов помнит лог измерений (его читает эмулятор: «тайминг держится»)
const LOG_MAX = 12;
const QUEUE_MAX = 5;
// Как часто проверять, освободилась ли сцена от рулетки и алерта
const POLL_MS = 120;

// Лотерея по одной: сцена розыгрыша или список билетов. Бот сам ставит их в одну очередь с рулеткой,
// поэтому здесь это страховка (как у рулетки): лотерея не выходит поверх вращения или алерта, а
// алерты, пока она ждёт и идёт, держатся (`claimed`). Длительность сцены фиксирована (shared/lottery.ts).
export const useLotteryStore = defineStore('lottery', () => {
  const current = ref<ActiveLottery | null>(null);
  const phase = ref<LotteryPhase>('intro');
  // Сколько барабанов уже встало (с последнего места к первому)
  const locked = ref(0);
  // Идёт показ: этого ждут рулетка и алерты
  const busy = ref(false);
  // Показов в очереди и на экране вместе: пока они есть, алерты не выходят
  const pending = ref(0);
  const claimed = computed(() => pending.value > 0);
  // Измеренная длительность сцен: сколько от появления до ухода
  const log = ref<{ id: number; total: number; winners: number; ms: number }[]>([]);

  const queue: Omit<ActiveLottery, 'id'>[] = [];
  let seq = 0;
  let running = false;

  const after = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, Math.max(0, ms)));

  // Ждём от момента `t0`, а не «ещё столько-то»: ошибки таймеров не копятся от шага к шагу
  const until = (t0: number, ms: number) => after(t0 + ms - performance.now());

  // Рулетка и алерт идут раньше: лотерея ждёт, пока они уйдут. Алерты читаются лениво, при вызове:
  // их стор сам читает этот, и в setup это замкнуло бы круг
  const stageIsFree = () => !useRouletteStore().busy && useAlertsStore().current === null;

  const playDraw = async (item: Extract<ActiveLottery, { kind: 'draw' }>) => {
    const count = item.payload.winners.length;
    const t0 = performance.now();
    locked.value = 0;
    phase.value = 'intro';
    current.value = item;

    await until(t0, LOTTERY_INTRO_MS);
    phase.value = 'draw';
    // Барабаны встают с последнего места к первому
    for (let place = count; place >= 1; place--) {
      await until(t0, LOTTERY_INTRO_MS + lotteryReelMs(place, count));
      locked.value++;
    }
    await until(t0, LOTTERY_INTRO_MS + LOTTERY_DRAW_MS);
    phase.value = 'finale';
    await until(t0, LOTTERY_INTRO_MS + LOTTERY_DRAW_MS + LOTTERY_FINALE_MS);

    current.value = null;
    log.value = [
      { id: item.id, total: item.payload.total, winners: count, ms: Math.round(performance.now() - t0) },
      ...log.value,
    ].slice(0, LOG_MAX);
  };

  const run = async () => {
    running = true;
    for (let next = queue.shift(); next; next = queue.shift()) {
      while (!stageIsFree()) await after(POLL_MS);
      busy.value = true;
      const item = { ...next, id: ++seq } as ActiveLottery;
      if (item.kind === 'draw') await playDraw(item);
      else {
        current.value = item;
        await after(LOTTERY_PARTICIPANTS_SHOW_MS);
        current.value = null;
      }
      // Пока выходит стикер, сцена ещё занята: следующий показ начнётся на пустом экране
      await after(LOTTERY_GAP_MS);
      busy.value = false;
      pending.value--;
    }
    running = false;
  };

  const enqueue = (item: Omit<ActiveLottery, 'id'>) => {
    if (queue.length >= QUEUE_MAX) {
      queue.shift();
      pending.value--;
    }
    queue.push(item);
    pending.value++;
    if (!running) void run();
  };

  const onDraw = (payload: LotteryDrawPayload) => enqueue({ kind: 'draw', payload });
  const onParticipants = (payload: LotteryParticipantsPayload) => enqueue({ kind: 'participants', payload });

  return { current, phase, locked, busy, claimed, log, onDraw, onParticipants };
});
