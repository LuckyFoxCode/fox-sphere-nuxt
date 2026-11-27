// Внутренний HTTP API админки на том же порту, что Socket.io. Вызывает его только сервер Nuxt, уже
// проверив сессию стримера; браузер сюда не ходит. Каждый запрос — с `Authorization: Bearer INTERNAL_SECRET`.
//   GET  /internal/state    состояние пульта
//   GET  /internal/followers  фолловеры канала для раздела «Зрители»
//   POST /internal/boost    включить или выключить буст XP
//   POST /internal/lottery  запустить розыгрыш
//   POST /internal/test     тестовый алерт или карточка на оверлей
import { createHash, timingSafeEqual } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import {
  INTERNAL_PREFIX,
  isLotteryRunRequest,
  isUsableSecret,
  parseBoostRequest,
  type AdminStreamState,
  type BoostRequest,
  type BotFollowers,
} from '../../shared/admin';
import { isTestEventKind, parseTestName, type TestEventKind } from '../../shared/testEvents';

// Отказ с понятной причиной: текст доходит до пульта
export class AdminError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export type AdminActions = {
  getState: () => Promise<AdminStreamState>;
  getFollowers: () => Promise<BotFollowers>;
  setBoost: (request: BoostRequest) => Promise<void>;
  runLottery: () => void;
  sendTest: (kind: TestEventKind, username: string) => void;
};

const MAX_BODY_BYTES = 4096;

const digest = (value: string) => createHash('sha256').update(value).digest();

const readJson = async (req: IncomingMessage): Promise<unknown> => {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req as AsyncIterable<Buffer>) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw new AdminError(413, 'слишком большой запрос');
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8') || 'null');
  } catch {
    throw new AdminError(400, 'неверный JSON');
  }
};

export const createInternalHandler = (secret: string | undefined, actions: () => AdminActions) => {
  const route = async (req: IncomingMessage): Promise<unknown> => {
    const path = (req.url ?? '').split('?')[0]!.slice(INTERNAL_PREFIX.length);

    if (req.method === 'GET' && path === '/state') return actions().getState();
    if (req.method === 'GET' && path === '/followers') return actions().getFollowers();
    if (req.method !== 'POST') throw new AdminError(404, 'нет такого адреса');

    if (path === '/boost') {
      const request = parseBoostRequest(await readJson(req));
      if (!request) throw new AdminError(400, 'неверное время буста');
      await actions().setBoost(request);
    } else if (path === '/lottery') {
      if (!isLotteryRunRequest(await readJson(req))) throw new AdminError(400, 'нет подтверждения розыгрыша');
      actions().runLottery();
    } else if (path === '/test') {
      const body = (await readJson(req)) as { kind?: unknown; username?: unknown } | null;
      const username = parseTestName(body?.username);
      if (!isTestEventKind(body?.kind) || !username) throw new AdminError(400, 'неверный тестовый алерт или ник');
      actions().sendTest(body.kind, username);
    } else {
      throw new AdminError(404, 'нет такого адреса');
    }
    return { ok: true };
  };

  return async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
    const send = (status: number, body: unknown) => {
      res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
      res.end(JSON.stringify(body));
    };
    try {
      if (!isUsableSecret(secret)) throw new AdminError(503, 'у бота не задан INTERNAL_SECRET (см. .env.example)');
      // Браузер присылает Origin, сервер Nuxt — нет: со страницы в этот API не попасть даже с секретом
      if (req.headers.origin !== undefined) throw new AdminError(403, 'запросы из браузера не принимаются');
      if (!timingSafeEqual(digest(req.headers.authorization ?? ''), digest(`Bearer ${secret}`))) {
        throw new AdminError(401, 'INTERNAL_SECRET у бота и сайта не совпадает');
      }
      send(200, await route(req));
    } catch (error) {
      if (error instanceof AdminError) return send(error.status, { error: error.message });
      console.error('[admin] запрос не выполнен:', error);
      send(500, { error: 'бот не смог выполнить действие, причина в его логе' });
    }
  };
};
