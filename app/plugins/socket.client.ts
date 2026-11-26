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

  const app = useAppStore();
  socket.on('connect', () => (app.connection = 'connected'));
  socket.on('disconnect', () => (app.connection = 'disconnected'));
  socket.on('connect_error', () => (app.connection = 'disconnected'));
  socket.on('chat:message', useChatStore().onMessage);
  const stream = useStreamStore();
  socket.on('connect', () => stream.sync(socket));
  socket.on('stream:xp-updated', stream.onUpdate);
  const bank = useBankStore();
  socket.on('connect', () => bank.sync(socket));
  socket.on('stream:jackpot-updated', bank.onUpdate);
  const music = useMusicStore();
  socket.on('connect', () => music.sync(socket));
  socket.on('music:now-playing', music.onUpdate);
  socket.on('roulette:spin-result', useRouletteStore().onSpin);
  const alerts = useAlertsStore();
  socket.on('twitch:follow', alerts.onFollow);
  socket.on('twitch:raid', alerts.onRaid);
  socket.on('twitch:reward-redeem', alerts.onRewardRedeem);
  socket.on('twitch:sub', alerts.onSub);
  socket.on('fishing:chest', alerts.onFishingChest);
  socket.on('twitch:golden-beer', alerts.onGoldenBeer);

  return { provide: { socket } };
});
