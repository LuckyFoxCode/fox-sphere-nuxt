import { defineStore } from 'pinia';
import type { StreamStatePayload } from '#shared/events';
import type { OverlaySocket } from '~/plugins/socket.client';

// Уровень и XP стрима. null — состояние от бота ещё не пришло, шапку показывать нечем.
export const useStreamStore = defineStore('stream', () => {
  const state = ref<StreamStatePayload | null>(null);
  let updates = 0;

  const onUpdate = (payload: StreamStatePayload) => {
    updates++;
    state.value = payload;
  };

  // Запрос при каждом подключении. Если пока ждали ответ пришло событие, оно новее ответа.
  const sync = (socket: OverlaySocket) => {
    const before = updates;
    socket.emit('stream:get-system-state', (current) => {
      if (current && updates === before) state.value = current;
    });
  };

  return { state, onUpdate, sync };
});
