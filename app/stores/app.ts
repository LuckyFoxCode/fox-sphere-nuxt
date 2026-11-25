import { defineStore } from 'pinia';

export type ConnectionState = 'connecting' | 'connected' | 'disconnected';

export const useAppStore = defineStore('app', () => {
  const ready = ref(false);
  // Связь с Socket.io-сервером бота; пишет плагин socket.client.ts
  const connection = ref<ConnectionState>('connecting');
  return { ready, connection };
});
