import { ChatClient, type ChatMessage } from '@twurple/chat';
import { createAnnouncer } from './announcements';
import { createAuth } from './auth';
import { createBadgeResolver } from './badges';
import { getJackpot } from './bank';
import { createBotOverlayChat } from './botMessages';
import { createRegistry } from './commands';
import { playLotteryScene, playParticipants } from './commands/lottery';
import { config } from './config';
import { startEventSub } from './eventsub';
import { createFollowerChecker } from './followers';
import { language, messages } from './language';
import { awardLotteryXp } from './lottery';
import { getNowPlaying, startMusicReader } from './music';
import { prisma } from './db';
import { emitEvent, startSocketServer, stopSocketServer } from './socket';
import { createSpinStage } from './spinStage';
import { addStreamXp, getStreamState } from './stream';
import { getActiveTimer } from './streamTimer';
import { getActiveXpBoost, startAutoXpBoost } from './xpBoost';
import type { ChatMessagePayload } from '../../shared/events';
import type { Viewer } from '../../generated/prisma/client';
import { DEFAULT_HERO_ID } from '../../shared/heroes';
import { getActiveHeroId } from './heroes';
import { awardBonusXp, awardMessageXp, ensureViewer } from './viewers';

// Одна очередь вращений на настоящие спины и эмулятор
const playSpin = createSpinStage();

await startSocketServer({
  getStreamState,
  getJackpot,
  getXpBoost: getActiveXpBoost,
  getTimer: getActiveTimer,
  getMusic: getNowPlaying,
  playDevSpin: (result) => {
    // Эмулятор базу не трогает: банк в конце — тот, что пришёл в событии
    void playSpin(
      async () => result,
      async () => emitEvent('stream:jackpot-updated', { jackpotTotal: result.jackpotTotalAfter }),
    ).catch((error: unknown) => console.error('[spin] эмуляция вращения не удалась:', error));
  },
  // Эмулятор лотереи: сцена и список встают в ту же очередь, что и рулетка; база и Twitch не трогаются
  playDevLottery: playLotteryScene,
  playDevParticipants: playParticipants,
});

// Виджет «сейчас играет» не зависит от Twitch: читатель работает и при BOT_ENABLED=false
const musicReader = startMusicReader({ onState: (state) => emitEvent('music:now-playing', state) });

if (!config.enabled) {
  console.log('[bot] BOT_ENABLED != true — бот выключен (так задумано для dev).');
  // Процесс жив за счёт Socket.io-сервера (эмулятор событий работает и без Twitch)
  const shutdownIdle = async () => {
    musicReader.stop();
    await stopSocketServer();
    process.exit(0);
  };
  process.on('SIGINT', shutdownIdle);
  process.on('SIGTERM', shutdownIdle);
} else {
  const channel = config.channelName();
  console.log(`[bot] включён. Канал: #${channel}, база: ${process.env.DATABASE_URL}`);

  const { authProvider, api, botUserId, ensureBroadcaster } = await createAuth();
  const isFollower = createFollowerChecker(api, ensureBroadcaster);
  const badges = createBadgeResolver(api, config.streamerId);
  void badges.load();
  const chat = new ChatClient({ authProvider, channels: [channel] });

  const showBotMessage = createBotOverlayChat({
    api,
    botUserId,
    streamerId: config.streamerId,
    ensureBroadcaster,
    badgeUrls: badges.urls,
  });

  const sameAsStreamer = config.streamerId !== '' && botUserId === config.streamerId;
  console.log(
    `[bot] аккаунт бота: id ${botUserId}${sameAsStreamer ? ' (тот же, что у стримера)' : ''}, ` +
      `префикс команд: "${config.prefix}"`,
  );

  // Как в старом боте: аккаунты стримера и бота не получают XP за сообщения
  const noXpIds = new Set([config.streamerId, config.botId, botUserId].filter(Boolean));

  // Общая часть payload `chat:message`; роли и бейджи дописываются по месту
  const baseChatPayload = (
    msg: ChatMessage,
    text: string,
  ): Pick<
    ChatMessagePayload,
    | 'id'
    | 'userId'
    | 'username'
    | 'displayName'
    | 'color'
    | 'text'
    | 'emotes'
    | 'timestamp'
    | 'isHighlight'
    | 'isAction'
  > => ({
    id: msg.id,
    userId: msg.userInfo.userId,
    username: msg.userInfo.userName,
    displayName: msg.userInfo.displayName,
    color: msg.userInfo.color || '#9146FF',
    text,
    emotes: Object.fromEntries(msg.emoteOffsets),
    timestamp: msg.date.getTime(),
    isHighlight: msg.isHighlight,
    isAction: false,
  });

  chat.onConnect(() => console.log('[bot] подключён к IRC Twitch'));
  chat.onJoin((joined) => console.log(`[bot] зашёл в чат ${joined}, слушаю сообщения`));
  chat.onJoinFailure((joined, reason) => console.error(`[bot] не удалось зайти в ${joined}: ${reason}`));
  chat.onAuthenticationFailure((text) => {
    console.error(`[bot] чат отклонил вход: ${text}. Авторизуйте бота заново (${config.loginUrl}).`);
  });

  // Twitch принял say(), но может отклонить само сообщение (бан, режим «только фолловеры», повтор)
  chat.onMessageFailed((_channel, reason) => console.error(`[bot] Twitch отклонил сообщение: ${reason}`));
  chat.onMessageRatelimit((_channel, text) => console.error(`[bot] лимит сообщений Twitch: ${text}`));
  chat.onNoPermission((_channel, text) => console.error(`[bot] нет прав на отправку: ${text}`));

  const announceStreamLevel = async (lvl: number) => {
    console.log(`[stream] стрим достиг уровня ${lvl}`);
    // Как в старом боте: в dev только лог
    if (!config.isProduction) return;
    const text = messages().streamLevelUp(lvl);
    await chat.say(channel, text);
    await showBotMessage(text);
  };

  const announcer = createAnnouncer({
    api,
    botUserId,
    broadcasterId: config.streamerId,
    onAnnouncementSent: (text, announceColor) =>
      showBotMessage(text, { isAnnouncement: true, announceColor }),
  });

  const announceViewerLevel = async (username: string, lvl: number, reply: (text: string) => Promise<void>) => {
    // Как в старом боте: в dev только лог, чтобы не поздравлять вторым после боевого
    if (!config.isProduction) {
      console.log(`[xp] dev: ${username} достиг(ла) уровня ${lvl}, в чат не отправляется`);
      return;
    }
    await reply(messages().levelUp(username, lvl));
  };

  // После начисления XP: шапка стрима и сообщения о новых уровнях в чат
  const showXpAward = async (
    username: string,
    award: { lvl: number; leveledUp: boolean },
    reply: (text: string) => Promise<void>,
    stream: Awaited<ReturnType<typeof addStreamXp>> | null,
  ) => {
    if (stream) emitEvent('stream:xp-updated', stream.state);

    if (award.leveledUp) await announceViewerLevel(username, award.lvl, reply);
    if (stream?.leveledUp) {
      // Как в старом боте: новый уровень стрима включает буст на 30 минут, если другого нет
      await startAutoXpBoost().catch((error: unknown) =>
        console.error('[xpboost] авто-буст не включился:', error),
      );
      await announceStreamLevel(stream.state.lvl);
    }
  };

  // Ошибка XP стрима не должна съедать сообщение о level-up зрителя
  const tryAddStreamXp = (amount: number) =>
    addStreamXp(amount).catch((error: unknown) => {
      console.error('[stream] не удалось начислить XP стриму:', error);
      return null;
    });

  const registry = createRegistry({
    prefix: config.prefix,
    playSpin,
    api,
    streamerId: config.streamerId,
    ensureBroadcaster,
    announce: announcer.announce,
    twitchVip: config.lotteryTwitchVip,
    say: async (text) => {
      console.log(`[bot] в чат: ${text}`);
      await chat.say(channel, text);
      await showBotMessage(text);
    },
    awardPrizeXp: async ({ viewer, displayName, reply }, xp) => {
      const award = await awardBonusXp(viewer.id, xp);
      const stream = await tryAddStreamXp(xp);
      return () => showXpAward(displayName, award, reply, stream);
    },
  });

  // +1 недельный XP за сообщение; на сотом выдаётся билет. Сбой здесь не должен съесть обычный XP
  const countLotteryTicket = async (displayName: string, userId: string, viewer: Viewer) => {
    try {
      if ((await awardLotteryXp(viewer)) !== 'ticket') return;
      console.log(`[lottery] ${displayName} получает билет`);
      emitEvent('lottery:ticket', { userId, username: displayName, lang: language() });
      // Как в старом боте: в dev только оверлей, в чат пишет боевой бот
      if (!config.isProduction) return;
      const text = messages().lottery.ticketEarned(displayName);
      await chat.say(channel, text);
      await showBotMessage(text);
    } catch (error) {
      console.error(`[lottery] недельный XP для ${displayName} не начислен:`, error);
    }
  };

  chat.onMessage(async (_channel, _user, text, msg) => {
    const info = msg.userInfo;
    console.log(`[chat] ${info.displayName}: ${text}`);

    try {
      // Helix нужен только фолловеру; стримеру и сабам проверка не нужна (у них и так максимум)
      const needsFollowCheck = !info.isBroadcaster && !info.isSubscriber;
      const roles = {
        isMod: info.isMod,
        isSubscriber: info.isSubscriber,
        isBroadcaster: info.isBroadcaster,
        isVip: info.isVip,
        isFollower: needsFollowCheck ? await isFollower(info.userId) : false,
      };
      const viewer = await ensureViewer(info.userId, info.displayName, roles);

      // В чат оверлея сообщение уходит до команд, чтобы ответ бота шёл следом, а не раньше
      emitEvent('chat:message', {
        ...baseChatPayload(msg, text),
        badges: badges.urls(info.badges),
        userLvl: viewer.lvl,
        isMod: roles.isMod,
        isFollower: roles.isFollower,
        isFounder: viewer.isFounder,
        isSubscriber: roles.isSubscriber,
        isVip: roles.isVip,
        isPermanentVip: viewer.isPermanentVip || viewer.isLuckyVip,
        isBroadcaster: roles.isBroadcaster,
        isBot: config.botId !== '' && info.userId === config.botId,
        // Сбой базы не должен убирать героя с экрана: при ошибке берём бесплатного, а ошибку пишем в лог
        hero: {
          heroId: await getActiveHeroId(viewer.id).catch((error: unknown) => {
            console.error(`[hero] герой ${info.displayName} не определён, беру ${DEFAULT_HERO_ID}:`, error);
            return DEFAULT_HERO_ID;
          }),
        },
      });
      const reply = async (answer: string) => {
        console.log(`[bot] ответ: ${answer}`);
        await chat.say(channel, answer, { replyTo: msg });
        await showBotMessage(answer);
      };

      const isCommand = await registry.dispatch(text, (args) => ({
        viewer,
        displayName: info.displayName,
        color: info.color || '#9146FF',
        roles,
        args,
        reply,
      }));
      if (isCommand) console.log(`[bot] команда от ${info.displayName} обработана`);

      // msg.channelId — id канала из самого сообщения: стример отсеется и без TWITCH_USER_ID
      if (info.userId === msg.channelId || noXpIds.has(info.userId)) return;

      // Недельный XP лотереи считается отдельно от обычного: свой кулдаун, без ролей и буста
      await countLotteryTicket(info.displayName, info.userId, viewer);

      const result = await awardMessageXp(viewer, roles);
      if (result.status === 'cooldown') {
        console.log(`[xp] ${info.displayName}: кулдаун, ещё ${Math.ceil(result.waitMs / 1000)} с`);
      } else {
        console.log(
          `[xp] ${info.displayName}: +${result.xp} XP ` +
            `(${roles.isBroadcaster ? 'стример' : roles.isSubscriber ? 'саб' : roles.isFollower ? 'фолловер' : 'зритель'}${roles.isVip ? ', VIP' : ''}) ` +
            `(всего XP ${result.totalXp}, уровень ${result.lvl})`,
        );
        // Тот же XP идёт стриму
        await showXpAward(info.displayName, result, reply, await tryAddStreamXp(result.xp));
      }
    } catch (error) {
      console.error('[bot] ошибка обработки сообщения:', error);
    }
  });

  // Алерты: в оверлей событие уходит всегда, а в чат отвечает только prod
  const eventSub = startEventSub({
    api,
    streamerId: config.streamerId,
    ensureBroadcaster,
    onFollow: async (follow) => {
      console.log(`[follow] ${follow.username}`);
      emitEvent('twitch:follow', follow);
      // В dev только лог: на тот же follow уже отвечает боевой бот
      if (!config.isProduction) {
        console.log('[follow] dev: благодарность в чат не отправляется');
        return;
      }
      const text = messages().follow(follow.username);
      await chat.say(channel, text);
      await showBotMessage(text);
    },
    onRaid: async (raid) => {
      console.log(`[raid] ${raid.raiderName}, зрителей: ${raid.viewers}`);
      emitEvent('twitch:raid', raid);
      // В dev только лог: на тот же рейд уже отвечает боевой бот
      if (!config.isProduction) {
        console.log('[raid] dev: анонс и шаутаут не отправляются');
        return;
      }
      await announcer.announce(messages().raid(raid.raiderName, raid.viewers), 'purple');
      await announcer.shoutout(raid.raiderId);
    },
    onRewardRedeem: (reward) => {
      console.log(`[reward] ${reward.username}: ${reward.rewardTitle}`);
      emitEvent('twitch:reward-redeem', reward);
    },
    onSub: (sub) => {
      console.log(`[sub] ${sub.kind}: ${sub.username ?? 'аноним'}`);
      emitEvent('twitch:sub', sub);
    },
  });

  await chat.connect();

  const shutdown = async () => {
    eventSub.stop();
    chat.quit();
    musicReader.stop();
    await stopSocketServer();
    await prisma.$disconnect();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}
