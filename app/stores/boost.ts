import { defineStore } from 'pinia';
import type { XpBoostPayload } from '#shared/events';
import type { OverlaySocket } from '~/plugins/socket.client';

// Буст XP стрима. null — буста нет. Остаток считается от абсолютного `expiresAt` на каждом тике,
// а не вычитанием секунды: OBS троттлит таймеры свёрнутого окна, и счётчик отстал бы от часов.
export const useBoostStore = defineStore('boost', () => {
  const boost = ref<XpBoostPayload | null>(null);
  const secondsLeft = ref(0);
  let interval: ReturnType<typeof setInterval> | undefined;
  let updates = 0;

  const stop = () => {
    clearInterval(interval);
    interval = undefined;
  };

  const tick = () => {
    if (!boost.value) return;
    secondsLeft.value = Math.max(0, Math.ceil((boost.value.expiresAt - Date.now()) / 1000));
    if (secondsLeft.value === 0) {
      boost.value = null;
      stop();
    }
  };

  const apply = (next: XpBoostPayload | null) => {
    stop();
    boost.value = next;
    secondsLeft.value = 0;
    if (!next) return;
    tick();
    // tick мог найти буст уже просроченным (оверлей открыт после окончания)
    if (boost.value) interval = setInterval(tick, 1000);
  };

  const onUpdate = (next: XpBoostPayload | null) => {
    updates++;
    apply(next);
  };

  // Запрос при каждом подключении. Если пока ждали ответ пришло событие, оно новее ответа.
  const sync = (socket: OverlaySocket) => {
    const before = updates;
    socket.emit('stream:get-xp-boost', (current) => {
      if (updates === before) apply(current);
    });
  };

  return { boost, secondsLeft, onUpdate, sync };
});
