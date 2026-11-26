import { createServer } from 'node:http';
import { Server } from 'socket.io';
import {
  isAddVipPayload,
  isChatMessagePayload,
  isFishingChestPayload,
  isFollowPayload,
  isGoldenBeerPayload,
  isHeroChangedPayload,
  isJackpotPayload,
  isLotteryDrawPayload,
  isLotteryParticipantsPayload,
  isLotteryTicketPayload,
  isMusicPayloadOrNull,
  isProfileShowPayload,
  isRaidPayload,
  isRewardRedeemPayload,
  isRouletteSpinPayload,
  isStreamStatePayload,
  isTimerPayload,
  isXpBoostOrNull,
  isSubPayload,
  resolveSocketPort,
  type ClientToServerEvents,
  type DevAck,
  type JackpotPayload,
  type LotteryDrawPayload,
  type LotteryParticipantsPayload,
  type MusicNowPlayingPayload,
  type RouletteSpinResultPayload,
  type ServerToClientEvents,
  type StreamStatePayload,
  type TimerPayload,
  type XpBoostPayload,
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

// Обработчик dev-события, которое просто пересылается оверлеям после проверки payload
const relayDev =
  <T>(isValid: (value: unknown) => value is T, send: (payload: T) => void) =>
  (payload: unknown, ack?: DevAck): void => {
    if (!devEvents) return ack?.({ ok: false, reason: 'эмулятор выключен (DEV_EVENTS)' });
    if (!isValid(payload)) return ack?.({ ok: false, reason: 'неверный payload' });
    send(payload);
    ack?.({ ok: true });
  };

// Откуда брать состояние и кто крутит рулетку, задаётся при запуске: сам сервер базу не читает
type SocketSources = {
  getStreamState: () => Promise<StreamStatePayload>;
  getJackpot: () => Promise<JackpotPayload>;
  getXpBoost: () => Promise<XpBoostPayload | null>;
  getTimer: () => Promise<TimerPayload | null>;
  getMusic: () => MusicNowPlayingPayload | null;
  playDevSpin: (result: RouletteSpinResultPayload) => void;
  playDevLottery: (payload: LotteryDrawPayload) => void;
  playDevParticipants: (payload: LotteryParticipantsPayload) => void;
};
let sources: SocketSources;

// null, если база не прочиталась: ошибка остаётся в логе бота
const load = async <T>(what: string, read: () => Promise<T>): Promise<T | null> => {
  try {
    return await read();
  } catch (error) {
    console.error(`[socket] не удалось прочитать ${what}:`, error);
    return null;
  }
};
const loadStreamState = () => load('состояние стрима', () => sources.getStreamState());
const loadJackpot = () => load('банк рулетки', () => sources.getJackpot());
const loadXpBoost = () => load('буст XP', () => sources.getXpBoost());
const loadTimer = () => load('таймер', () => sources.getTimer());

io.on('connection', (socket) => {
  console.log(`[socket] клиент подключился (${io.engine.clientsCount})`);
  socket.on('disconnect', () => console.log(`[socket] клиент отключился (${io.engine.clientsCount})`));

  socket.on('dev:chat-message', (payload, ack) => {
    if (!devEvents) return ack?.({ ok: false, reason: 'эмулятор выключен (DEV_EVENTS)' });
    if (!isChatMessagePayload(payload)) return ack?.({ ok: false, reason: 'неверный payload' });
    emitEvent('chat:message', payload);
    ack?.({ ok: true });
  });

  socket.on('dev:hero-changed', relayDev(isHeroChangedPayload, (payload) => emitEvent('hero:changed', payload)));

  // Ack ждёт оверлей: отвечаем всегда, при ошибке — null
  socket.on('stream:get-system-state', async (ack) => {
    if (typeof ack !== 'function') return;
    ack(await loadStreamState());
  });

  socket.on('dev:stream-state', (payload, ack) => {
    if (!devEvents) return ack?.({ ok: false, reason: 'эмулятор выключен (DEV_EVENTS)' });
    if (!isStreamStatePayload(payload)) return ack?.({ ok: false, reason: 'неверный payload' });
    emitEvent('stream:xp-updated', payload);
    ack?.({ ok: true });
  });

  socket.on('dev:stream-reset', async (ack) => {
    if (!devEvents) return ack?.({ ok: false, reason: 'эмулятор выключен (DEV_EVENTS)' });
    const state = await loadStreamState();
    if (!state) return ack?.({ ok: false, reason: 'не удалось прочитать базу' });
    emitEvent('stream:xp-updated', state);
    ack?.({ ok: true });
  });

  // Буст XP и таймер: оверлей спрашивает состояние при подключении, база не прочиталась - null.
  // Эмулятор в базу ничего не пишет, `*-reset` возвращает оверлеям то, что лежит в базе.
  socket.on('stream:get-xp-boost', async (ack) => {
    if (typeof ack !== 'function') return;
    ack(await loadXpBoost());
  });
  socket.on('dev:xp-boost', (payload, ack) => {
    if (!devEvents) return ack?.({ ok: false, reason: 'эмулятор выключен (DEV_EVENTS)' });
    if (!isXpBoostOrNull(payload)) return ack?.({ ok: false, reason: 'неверный payload' });
    emitEvent('stream:xp-boost', payload);
    ack?.({ ok: true });
  });
  socket.on('dev:xp-boost-reset', async (ack) => {
    if (!devEvents) return ack?.({ ok: false, reason: 'эмулятор выключен (DEV_EVENTS)' });
    emitEvent('stream:xp-boost', await loadXpBoost());
    ack?.({ ok: true });
  });

  socket.on('twitch:get-timer', async (ack) => {
    if (typeof ack !== 'function') return;
    ack(await loadTimer());
  });
  socket.on('dev:timer', relayDev(isTimerPayload, (payload) => emitEvent('twitch:timer', payload)));
  socket.on('dev:timer-stop', (ack) => {
    if (!devEvents) return ack?.({ ok: false, reason: 'эмулятор выключен (DEV_EVENTS)' });
    emitEvent('twitch:timer-stop');
    ack?.({ ok: true });
  });
  socket.on('dev:timer-reset', async (ack) => {
    if (!devEvents) return ack?.({ ok: false, reason: 'эмулятор выключен (DEV_EVENTS)' });
    const timer = await loadTimer();
    if (timer) emitEvent('twitch:timer', timer);
    else emitEvent('twitch:timer-stop');
    ack?.({ ok: true });
  });

  // Алерты
  socket.on('dev:follow', relayDev(isFollowPayload, (payload) => emitEvent('twitch:follow', payload)));
  socket.on('dev:raid', relayDev(isRaidPayload, (payload) => emitEvent('twitch:raid', payload)));
  socket.on(
    'dev:reward-redeem',
    relayDev(isRewardRedeemPayload, (payload) => emitEvent('twitch:reward-redeem', payload)),
  );
  socket.on('dev:sub', relayDev(isSubPayload, (payload) => emitEvent('twitch:sub', payload)));
  socket.on('dev:fishing-chest', relayDev(isFishingChestPayload, (payload) => emitEvent('fishing:chest', payload)));
  socket.on('dev:add-vip', relayDev(isAddVipPayload, (payload) => emitEvent('twitch:add-vip', payload)));
  socket.on('dev:profile', relayDev(isProfileShowPayload, (payload) => emitEvent('profile:show', payload)));
  socket.on('dev:golden-beer', relayDev(isGoldenBeerPayload, (payload) => emitEvent('twitch:golden-beer', payload)));

  // Музыка. Состояние лежит в памяти бота, поэтому ответ мгновенный; оверлей сам отбросит устаревшее
  socket.on('music:get-current', (ack) => {
    if (typeof ack !== 'function') return;
    ack(sources.getMusic());
  });
  // null - «скрыть виджет»; в память бота эмулятор ничего не пишет
  socket.on('dev:music', (payload, ack) => {
    if (!devEvents) return ack?.({ ok: false, reason: 'эмулятор выключен (DEV_EVENTS)' });
    if (!isMusicPayloadOrNull(payload)) return ack?.({ ok: false, reason: 'неверный payload' });
    emitEvent('music:now-playing', payload);
    ack?.({ ok: true });
  });

  // Лотерея: сцена и список встают в очередь сцены бота (после рулетки), билет идёт алертом сразу
  socket.on('dev:lottery-draw', relayDev(isLotteryDrawPayload, (payload) => sources.playDevLottery(payload)));
  socket.on(
    'dev:lottery-participants',
    relayDev(isLotteryParticipantsPayload, (payload) => sources.playDevParticipants(payload)),
  );
  socket.on('dev:lottery-ticket', relayDev(isLotteryTicketPayload, (payload) => emitEvent('lottery:ticket', payload)));

  // Рулетка и банк
  socket.on('stream:get-jackpot', async (ack) => {
    if (typeof ack !== 'function') return;
    ack(await loadJackpot());
  });
  socket.on('dev:roulette-spin', relayDev(isRouletteSpinPayload, (payload) => sources.playDevSpin(payload)));
  socket.on('dev:jackpot', relayDev(isJackpotPayload, (payload) => emitEvent('stream:jackpot-updated', payload)));
  socket.on('dev:jackpot-reset', async (ack) => {
    if (!devEvents) return ack?.({ ok: false, reason: 'эмулятор выключен (DEV_EVENTS)' });
    const state = await loadJackpot();
    if (!state) return ack?.({ ok: false, reason: 'не удалось прочитать базу' });
    emitEvent('stream:jackpot-updated', state);
    ack?.({ ok: true });
  });
});

export const startSocketServer = (options: SocketSources): Promise<void> =>
  new Promise((resolve, reject) => {
    sources = options;
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
