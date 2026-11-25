import { ChatClient, type ChatMessage } from '@twurple/chat';
import { createAnnouncer } from './announcements';
import { createAuth } from './auth';
import { createBadgeResolver } from './badges';
import { createBotOverlayChat } from './botMessages';
import { createRegistry } from './commands';
import { config } from './config';
import { startEventSub } from './eventsub';
import { createFollowerChecker } from './followers';
import { prisma } from './db';
import { emitEvent, startSocketServer, stopSocketServer } from './socket';
import { addStreamXp, getStreamState } from './stream';
import type { ChatMessagePayload } from '../../shared/events';
import { awardMessageXp, ensureViewer } from './viewers';

await startSocketServer({ getStreamState });

if (!config.enabled) {
  console.log('[bot] BOT_ENABLED != true — бот выключен (так задумано для dev).');
  // Процесс жив за счёт Socket.io-сервера (эмулятор событий работает и без Twitch)
  const shutdownIdle = async () => {
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
  const registry = createRegistry(config.prefix);
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
    // Текст из старого fox-sphere (BOT_MESSAGES.ALERTS.LEVEL_UP_STREAM)
    const text = `⚡ STREAM LEVEL UP! We are now Level ${lvl}! Keep spamming those messages! 🚀`;
    await chat.say(channel, text);
    await showBotMessage(text);
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
      });
      const reply = async (answer: string) => {
        console.log(`[bot] ответ: ${answer}`);
        await chat.say(channel, answer, { replyTo: msg });
        await showBotMessage(answer);
      };

      const isCommand = await registry.dispatch(text, (args) => ({
        viewer,
        displayName: info.displayName,
        args,
        reply,
      }));
      if (isCommand) console.log(`[bot] команда от ${info.displayName} обработана`);

      // msg.channelId — id канала из самого сообщения: стример отсеется и без TWITCH_USER_ID
      if (info.userId === msg.channelId || noXpIds.has(info.userId)) return;

      const result = await awardMessageXp(viewer, roles);
      if (result.status === 'cooldown') {
        console.log(`[xp] ${info.displayName}: кулдаун, ещё ${Math.ceil(result.waitMs / 1000)} с`);
      } else {
        console.log(
          `[xp] ${info.displayName}: +${result.xp} XP ` +
            `(${roles.isBroadcaster ? 'стример' : roles.isSubscriber ? 'саб' : roles.isFollower ? 'фолловер' : 'зритель'}${roles.isVip ? ', VIP' : ''}) ` +
            `(всего XP ${result.totalXp}, уровень ${result.lvl})`,
        );
        // lvl в xp:gain — уровень до начисления: полоса дойдёт до 100%, а переход покажет level:up
        emitEvent('xp:gain', {
          twitchId: info.userId,
          username: info.displayName,
          amount: result.xp,
          totalXp: result.totalXp,
          lvl: viewer.lvl,
        });
        if (result.leveledUp) {
          emitEvent('level:up', {
            twitchId: info.userId,
            username: info.displayName,
            fromLvl: viewer.lvl,
            toLvl: result.lvl,
          });
        }
        // Тот же XP идёт стриму. Ошибка здесь не должна съедать сообщение о level-up зрителя
        const stream = await addStreamXp(result.xp).catch((error: unknown) => {
          console.error('[stream] не удалось начислить XP стриму:', error);
          return null;
        });
        if (stream) emitEvent('stream:xp-updated', stream.state);

        if (result.leveledUp) await reply(`@${info.displayName} достиг(ла) уровня ${result.lvl}! 🎉`);
        if (stream?.leveledUp) await announceStreamLevel(stream.state.lvl);
      }
    } catch (error) {
      console.error('[bot] ошибка обработки сообщения:', error);
    }
  });

  const announcer = createAnnouncer({
    api,
    botUserId,
    broadcasterId: config.streamerId,
    onAnnouncementSent: (text, announceColor) =>
      showBotMessage(text, { isAnnouncement: true, announceColor }),
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
      // Текст из старого fox-sphere (BOT_MESSAGES.ALERTS.FOLLOW)
      const text = `🎉 Thanks for the follow, @${follow.username}! Welcome to the Foxsphere family! 🚀`;
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
      // Текст из старого fox-sphere (BOT_MESSAGES.ALERTS.RAID)
      await announcer.announce(
        `⚡ @${raid.raiderName} just raided with ${raid.viewers} viewers! Welcome to the Sphere! 🦊🌐✨`,
        'purple',
      );
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
    await stopSocketServer();
    await prisma.$disconnect();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}
