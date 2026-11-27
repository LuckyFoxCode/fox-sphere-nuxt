// Лотерея VIP: !ticket (алиас !билет), !tickets (!розыгрыш) и !runlottery (!lottery, !лотерея).
// Сам запуск розыгрыша (createLotteryRunner) общий с кнопкой в админке.
// Названия, алиасы, права (розыгрыш запускает только стример), правила и кулдауны — из старого
// fox-sphere; сцена на оверлее новая (shared/lottery.ts): её длительность не зависит от числа участников.
// Новое по сравнению со старым: победители пишутся в чат в момент, когда встал последний барабан
// (раньше — по одному с паузами, и тайминг уезжал), повторный запуск во время розыгрыша не принимается
// (иначе второй запуск без билетов снял бы VIP, только что выданный первым), в dev VIP на Twitch не меняется.
import type { ApiClient } from '@twurple/api';
import type { ChatAnnounceColor, LotteryDrawPayload, LotteryParticipantsPayload } from '../../../shared/events';
import {
  LOTTERY_CONFIG,
  LOTTERY_ENTRIES_MAX,
  LOTTERY_GAP_MS,
  LOTTERY_LIST_MIN,
  LOTTERY_PARTICIPANTS_SHOW_MS,
  LOTTERY_REVEAL_AT_MS,
  LOTTERY_SCENE_MS,
} from '../../../shared/lottery';
import { codeCommand } from '../../../shared/commands';
import { prisma } from '../db';
import { language, messages } from '../language';
import { buildDrawPayload, getTicketHolders, runDraw, type DrawOutcome } from '../lottery';
import { emitEvent } from '../socket';
import { onStage, sleep } from '../spinStage';
import type { CommandRegistry } from './registry';

const TICKET_COOLDOWN_MS = 10_000;
const RUN_COOLDOWN_MS = 5000;
// Между строками «Place #N» в чате: Twitch не любит очередь из пяти сообщений за один миг

export type LotteryDeps = {
  api: ApiClient;
  // Канал (TWITCH_USER_ID): VIP выдаётся от его имени
  streamerId: string;
  ensureBroadcaster: () => Promise<boolean>;
  // false — анонс не ушёл (нет прав): тогда тот же текст пишется обычным сообщением
  announce: (text: string, color: ChatAnnounceColor) => Promise<boolean>;
  // Обычное сообщение в чат канала (не ответ на команду): в чате и в виджете чата на оверлее
  say: (text: string) => Promise<void>;
  // Менять ли VIP на самом Twitch (config.lotteryTwitchVip)
  twitchVip: boolean;
};

type Drawn = Extract<DrawOutcome, { kind: 'drawn' }>;

// Сцена общая с рулеткой: лотерея ждёт своей очереди и держит экран, пока идёт (так её показывает эмулятор)
export const playLotteryScene = (payload: LotteryDrawPayload): void =>
  onStage(async () => {
    emitEvent('lottery:draw', payload);
    await sleep(LOTTERY_SCENE_MS + LOTTERY_GAP_MS);
  });

export const playParticipants = (payload: LotteryParticipantsPayload): void =>
  onStage(async () => {
    emitEvent('lottery:participants', payload);
    await sleep(LOTTERY_PARTICIPANTS_SHOW_MS + LOTTERY_GAP_MS);
  });

export type LotteryRunner = {
  twitchVip: boolean;
  isRunning: () => boolean;
  // false — розыгрыш уже поставлен в очередь или идёт, второй не начат
  start: () => boolean;
};

// Один запуск розыгрыша на всех, кто может его начать: `!runlottery` и кнопка в админке
export const createLotteryRunner = (deps: LotteryDeps): LotteryRunner => {
  const { api, streamerId, ensureBroadcaster, announce, say, twitchVip } = deps;
  // Розыгрыш поставлен в очередь или идёт: второй запуск поверх не принимается
  let running = false;

  const setTwitchVip = async (userId: string, on: boolean): Promise<void> => {
    if (!twitchVip) {
      console.log(`[lottery] VIP ${on ? 'выдача' : 'снятие'} (${userId}) на Twitch не отправляется: LOTTERY_TWITCH_VIP не включён`);
      return;
    }
    if (!streamerId || !(await ensureBroadcaster())) {
      throw new Error('нет токена стримера (откройте /auth/twitch/broadcaster/login)');
    }
    // «Уже VIP» и «уже не VIP» — не ошибки: база просто совпадает с Twitch
    const isVipNow = await api.asUser(streamerId, (c) => c.channels.checkVipForUser(streamerId, userId));
    if (on && !isVipNow) await api.asUser(streamerId, (c) => c.channels.addVip(streamerId, userId));
    else if (!on && isVipNow) await api.asUser(streamerId, (c) => c.channels.removeVip(streamerId, userId));
  };

  // Прошлые победители теряют VIP (кроме постоянных и тех, кто выиграл снова), новые его получают.
  // Идёт, пока на оверлее сцена; возвращает тех, кому выдать не удалось
  const rotateVip = async (outcome: DrawOutcome): Promise<Set<string>> => {
    const failed = new Set<string>();
    const winnerIds = new Set(outcome.kind === 'drawn' ? outcome.winners.map((w) => w.twitchId) : []);
    const permanent = new Set(
      (
        await prisma.viewer.findMany({
          where: { twitchId: { in: outcome.oldWinners.map((p) => p.twitchId) }, isPermanentVip: true },
          select: { twitchId: true },
        })
      ).map((v) => v.twitchId),
    );

    for (const old of outcome.oldWinners) {
      if (permanent.has(old.twitchId) || winnerIds.has(old.twitchId)) continue;
      try {
        await setTwitchVip(old.twitchId, false);
        console.log(`[lottery] временный VIP снят: ${old.username}`);
      } catch (error) {
        console.error(`[lottery] не удалось снять VIP с ${old.username}:`, error);
      }
    }
    if (outcome.kind !== 'drawn') return failed;

    for (const winner of outcome.winners) {
      // VIP с прошлой недели у него уже есть: запрос не нужен
      if (winner.returning) continue;
      try {
        await setTwitchVip(winner.twitchId, true);
        console.log(`[lottery] VIP выдан: ${winner.username}`);
      } catch (error) {
        console.error(`[lottery] не удалось выдать VIP ${winner.username}:`, error);
        failed.add(winner.twitchId);
      }
    }
    return failed;
  };

  const announceOrSay = async (text: string) => {
    if (!(await announce(text, 'purple'))) await say(text);
  };

  // Всё, что происходит, когда очередь дошла до лотереи
  const runOnStage = async (): Promise<void> => {
    const t = messages().lottery;
    const outcome = await runDraw();

    if (outcome.kind === 'empty') {
      console.log('[lottery] розыгрыш запущен, но билетов ни у кого нет');
      await rotateVip(outcome);
      await say(t.postponed);
      return;
    }

    const startedAt = Date.now();
    const payload = buildDrawPayload(outcome, language());
    emitEvent('lottery:draw', payload);
    console.log(
      `[lottery] участников ${payload.total}, победители: ${outcome.winners.map((w) => w.username).join(', ')}`,
    );

    // В фоне, пока идёт сцена: к моменту объявления победителей VIP уже выдан
    const rotation = rotateVip(outcome);
    await announceOrSay(t.start);

    await sleep(LOTTERY_REVEAL_AT_MS - (Date.now() - startedAt));
    const failed = await rotation;
    await announceFailures(outcome, failed);

    // Итог в чат — когда сцена закончилась, чтобы не раскрывать победителей раньше экрана
    await sleep(LOTTERY_SCENE_MS - (Date.now() - startedAt));
    await announceOrSay(t.final);
    await sleep(LOTTERY_GAP_MS);
  };

  // Победителей показывает оверлей, в чат идут только старт, итог и сбои выдачи VIP
  const announceFailures = async (outcome: Drawn, failed: Set<string>) => {
    const t = messages().lottery;
    for (const winner of outcome.winners) {
      if (failed.has(winner.twitchId)) await say(t.vipFailed(winner.username));
    }
  };

  return {
    twitchVip,
    isRunning: () => running,
    start: () => {
      if (running) return false;
      running = true;
      onStage(async () => {
        try {
          await runOnStage();
        } catch (error) {
          console.error('[lottery] розыгрыш не удался:', error);
        } finally {
          running = false;
        }
      });
      return true;
    },
  };
};

export const registerLotteryCommands = (registry: CommandRegistry, runner: LotteryRunner): void => {
  registry.register({
    ...codeCommand('ticket'),
    cooldownMs: TICKET_COOLDOWN_MS,
    run: async ({ viewer, displayName, reply }) => {
      const t = messages().lottery;
      // Строка зрителя в контексте — на момент сообщения; прогресс читаем заново
      const fresh = (await prisma.viewer.findUnique({ where: { id: viewer.id } })) ?? viewer;
      await reply(
        fresh.hasTicket
          ? t.ticketHave(displayName)
          : t.ticketProgress(displayName, fresh.xpThisWeek, LOTTERY_CONFIG.TICKET_XP_THRESHOLD),
      );
    },
  });

  registry.register({
    ...codeCommand('tickets'),
    cooldownMs: TICKET_COOLDOWN_MS,
    cooldownScope: 'global',
    run: async ({ reply }) => {
      const t = messages().lottery;
      const holders = await getTicketHolders();

      if (holders.length === 0) {
        await reply(t.noTicketsYet);
        return;
      }

      if (holders.length >= LOTTERY_LIST_MIN) {
        playParticipants({
          total: holders.length,
          names: holders.slice(0, LOTTERY_ENTRIES_MAX).map((holder) => holder.username),
          lang: language(),
        });
        await reply(t.totalTickets(holders.length));
        return;
      }

      const names = holders.map((holder, index) => `🔹 ${index + 1}. @${holder.username}`).join(', ');
      await reply(t.ticketList(names, holders.length, LOTTERY_CONFIG.TICKET_XP_THRESHOLD));
    },
  });

  registry.register({
    ...codeCommand('runlottery'),
    cooldownMs: RUN_COOLDOWN_MS,
    run: async ({ displayName, roles, reply, releaseCooldown }) => {
      const t = messages().lottery;
      if (!roles.isBroadcaster) {
        releaseCooldown();
        await reply(messages().denied(displayName));
        return;
      }
      if (!runner.start()) {
        releaseCooldown();
        await reply(t.alreadyRunning(displayName));
      }
    },
  });
};
