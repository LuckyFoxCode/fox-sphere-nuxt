import { io, type Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '#shared/events';

export type OverlaySocket = Socket<ServerToClientEvents, ClientToServerEvents>;

// Клиент Socket.io к серверу бота. Соединение открывает страница (`$socket.connect()`),
// переподключение — встроенное: после обрыва пробуем снова каждые 1–5 с, без лимита попыток.
export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig();
  const url =
    config.public.socketUrl || `${location.protocol}//${location.hostname}:${config.public.socketPort}`;

  const socket: OverlaySocket = io(url, {
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  const xp = useXpStore();
  socket.on('connect', () => (xp.connection = 'connected'));
  socket.on('disconnect', () => (xp.connection = 'disconnected'));
  socket.on('connect_error', () => (xp.connection = 'disconnected'));
  socket.on('xp:gain', xp.onXpGain);
  socket.on('level:up', xp.onLevelUp);
  socket.on('chat:message', useChatStore().onMessage);
  const stream = useStreamStore();
  socket.on('connect', () => stream.sync(socket));
  socket.on('stream:xp-updated', stream.onUpdate);
  const alerts = useAlertsStore();
  socket.on('twitch:follow', alerts.onFollow);
  socket.on('twitch:raid', alerts.onRaid);
  socket.on('twitch:reward-redeem', alerts.onRewardRedeem);
  socket.on('twitch:sub', alerts.onSub);

  return { provide: { socket } };
});
