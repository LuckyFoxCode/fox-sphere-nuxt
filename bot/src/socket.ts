import { createServer } from 'node:http';
import { Server } from 'socket.io';
import {
  isLevelUpPayload,
  isXpGainPayload,
  resolveSocketPort,
  type ClientToServerEvents,
  type ServerToClientEvents,
} from '../../shared/events';

// Socket.io на встроенном HTTP-сервере Node (без Express). Оверлей в OBS подключается сюда.
// Запускается всегда, даже при BOT_ENABLED=false: так оверлей можно тестировать без Twitch.
const port = resolveSocketPort(process.env.SOCKET_PORT);
// По умолчанию только своя машина: OBS и Nuxt обычно рядом. Для другой машины — SOCKET_HOST=0.0.0.0
const host = process.env.SOCKET_HOST || '127.0.0.1';
const overlayUrl = process.env.OVERLAY_URL || 'http://localhost:3001';
// Эмулятор событий (/dev/events). По умолчанию включён везде, кроме NODE_ENV=production.
const devEvents = process.env.DEV_EVENTS
  ? process.env.DEV_EVENTS === 'true'
  : process.env.NODE_ENV !== 'production';

const httpServer = createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'content-type': 'text/plain' });
    res.end('ok');
    return;
  }
  res.writeHead(404);
  res.end();
});

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  // Страница оверлея грузится с адреса Nuxt (localhost:3001 / 3000), сокет — с другого порта
  cors: { origin: [overlayUrl, /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/] },
});

// Типизированная отправка: бот шлёт события только через эту функцию
export const emitEvent = <E extends keyof ServerToClientEvents>(
  event: E,
  ...args: Parameters<ServerToClientEvents[E]>
): void => {
  io.emit(event, ...args);
};

io.on('connection', (socket) => {
  console.log(`[socket] клиент подключился (${io.engine.clientsCount})`);
  socket.on('disconnect', () => console.log(`[socket] клиент отключился (${io.engine.clientsCount})`));

  socket.on('dev:xp-gain', (payload, ack) => {
    if (!devEvents) return ack?.({ ok: false, reason: 'эмулятор выключен (DEV_EVENTS)' });
    if (!isXpGainPayload(payload)) return ack?.({ ok: false, reason: 'неверный payload' });
    emitEvent('xp:gain', payload);
    ack?.({ ok: true });
  });

  socket.on('dev:level-up', (payload, ack) => {
    if (!devEvents) return ack?.({ ok: false, reason: 'эмулятор выключен (DEV_EVENTS)' });
    if (!isLevelUpPayload(payload)) return ack?.({ ok: false, reason: 'неверный payload' });
    emitEvent('level:up', payload);
    ack?.({ ok: true });
  });
});

export const startSocketServer = (): Promise<void> =>
  new Promise((resolve, reject) => {
    httpServer.once('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        reject(new Error(`порт ${port} занят. Задайте другой SOCKET_PORT в .env.* (и тот же для Nuxt).`));
      } else {
        reject(error);
      }
    });
    httpServer.listen(port, host, () => {
      console.log(
        `[socket] Socket.io слушает http://${host}:${port}` +
          (devEvents ? ', эмулятор событий включён' : ''),
      );
      resolve();
    });
  });

export const stopSocketServer = (): Promise<void> =>
  new Promise((resolve) => {
    void io.close(() => resolve());
  });
