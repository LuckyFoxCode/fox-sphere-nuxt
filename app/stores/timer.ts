import { defineStore } from 'pinia';
import type { TimerPayload } from '#shared/events';
import type { OverlaySocket } from '~/plugins/socket.client';

// Идущий `!timer`. null — таймера нет. Остаток считается от абсолютного `endsAt` на каждом тике,
// а не вычитанием секунды: OBS троттлит таймеры свёрнутого окна, а таймер, поднятый посреди
// стрима, обязан показать настоящее время. `finished` растёт, только когда таймер дошёл до нуля
// сам: `!stoptimer` и подмена новым таймером его не трогают, поэтому звук окончания
// на отмену не играет.
export const useTimerStore = defineStore('timer', () => {
  const timer = ref<TimerPayload | null>(null);
  const secondsLeft = ref(0);
  // true — таймер стоит на паузе: цифры замерли, сам до нуля не дойдёт
  const paused = computed(() => timer.value?.pausedLeftMs !== undefined);
  const finished = ref(0);
  let interval: ReturnType<typeof setInterval> | undefined;
  let updates = 0;

  const stop = () => {
    clearInterval(interval);
    interval = undefined;
  };

  const tick = () => {
    if (!timer.value) return;
    secondsLeft.value = Math.max(0, Math.ceil((timer.value.endsAt - Date.now()) / 1000));
    if (secondsLeft.value === 0) {
      timer.value = null;
      stop();
      finished.value++;
    }
  };

  const apply = (next: TimerPayload | null) => {
    stop();
    timer.value = next;
    secondsLeft.value = 0;
    if (!next) return;
    if (next.pausedLeftMs !== undefined) {
      secondsLeft.value = Math.ceil(next.pausedLeftMs / 1000);
      return;
    }
    tick();
    if (timer.value) interval = setInterval(tick, 1000);
  };

  const onStart = (next: TimerPayload) => {
    updates++;
    apply(next);
  };

  const onStop = () => {
    updates++;
    apply(null);
  };

  // Запрос при каждом подключении: `!timer`, запущенный до открытия OBS, иначе не появился бы.
  // Просроченный таймер бот отдаёт как null, поэтому звук окончания после перезагрузки не играет.
  const sync = (socket: OverlaySocket) => {
    const before = updates;
    socket.emit('twitch:get-timer', (current) => {
      if (updates === before) apply(current);
    });
  };

  return { timer, secondsLeft, paused, finished, onStart, onStop, sync };
});
