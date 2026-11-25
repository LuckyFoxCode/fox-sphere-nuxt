import { defineStore } from 'pinia';
import type { JackpotPayload } from '#shared/events';
import type { OverlaySocket } from '~/plugins/socket.client';

// Банк рулетки. null — значение от бота ещё не пришло.
export const useBankStore = defineStore('bank', () => {
  const total = ref<number | null>(null);
  let updates = 0;

  const onUpdate = ({ jackpotTotal }: JackpotPayload) => {
    updates++;
    total.value = jackpotTotal;
  };

  // Запрос при каждом подключении. Если пока ждали ответ пришло событие, оно новее ответа.
  const sync = (socket: OverlaySocket) => {
    const before = updates;
    socket.emit('stream:get-jackpot', (current) => {
      if (current && updates === before) total.value = current.jackpotTotal;
    });
  };

  return { total, onUpdate, sync };
});
