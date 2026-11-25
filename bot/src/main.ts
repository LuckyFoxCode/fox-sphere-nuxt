import { ChatClient } from '@twurple/chat';
import { createAuth } from './auth';
import { createRegistry } from './commands';
import { config } from './config';
import { createFollowerChecker } from './followers';
import { prisma } from './db';
import { awardMessageXp, ensureViewer } from './viewers';

if (!config.enabled) {
  console.log('[bot] BOT_ENABLED != true — бот выключен (так задумано для dev).');
  // Держим процесс живым, чтобы concurrently/watch не считал его упавшим
  setInterval(() => {}, 1 << 30);
} else {
  const channel = config.channelName();
  console.log(`[bot] включён. Канал: #${channel}, база: ${process.env.DATABASE_URL}`);

  const { authProvider, api, botUserId, ensureBroadcaster } = await createAuth();
  const isFollower = createFollowerChecker(api, ensureBroadcaster);
  const registry = createRegistry(config.prefix);
  const chat = new ChatClient({ authProvider, channels: [channel] });

  // Бот может быть тем же аккаунтом, что и стример: тогда сообщения стримера и ответы бота
  // приходят с одним userId. Поэтому свои ответы узнаём по тексту, а не по userId.
  const sentByBot = new Set<string>();
  const sameAsStreamer = config.streamerId !== '' && botUserId === config.streamerId;
  console.log(
    `[bot] аккаунт бота: id ${botUserId}${sameAsStreamer ? ' (тот же, что у стримера)' : ''}, ` +
      `префикс команд: "${config.prefix}"`,
  );

  chat.onConnect(() => console.log('[bot] подключён к IRC Twitch'));
  chat.onJoin((joined) => console.log(`[bot] зашёл в чат ${joined}, слушаю сообщения`));
  chat.onJoinFailure((joined, reason) => console.error(`[bot] не удалось зайти в ${joined}: ${reason}`));
  chat.onAuthenticationFailure((text) => {
    console.error(`[bot] чат отклонил вход: ${text}. Авторизуйте бота заново (${config.loginUrl}).`);
  });

  chat.onMessage(async (_channel, _user, text, msg) => {
    const info = msg.userInfo;
    if (sentByBot.has(text)) {
      sentByBot.delete(text);
      return; // это наш собственный ответ
    }
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
      const reply = async (answer: string) => {
        sentByBot.add(answer);
        console.log(`[bot] ответ: ${answer}`);
        await chat.say(channel, answer, { replyTo: msg });
      };

      const isCommand = await registry.dispatch(text, (args) => ({
        viewer,
        displayName: info.displayName,
        args,
        reply,
      }));
      if (isCommand) console.log(`[bot] команда от ${info.displayName} обработана`);

      const result = await awardMessageXp(viewer, roles);
      if (result.status === 'cooldown') {
        console.log(`[xp] ${info.displayName}: кулдаун, ещё ${Math.ceil(result.waitMs / 1000)} с`);
      } else {
        console.log(
          `[xp] ${info.displayName}: +${result.xp} XP ` +
            `(${roles.isBroadcaster ? 'стример' : roles.isSubscriber ? 'саб' : roles.isFollower ? 'фолловер' : 'зритель'}${roles.isVip ? ', VIP' : ''}) ` +
            `(всего XP ${result.totalXp}, уровень ${result.lvl})`,
        );
        if (result.leveledUp) await reply(`@${info.displayName} достиг(ла) уровня ${result.lvl}! 🎉`);
      }
    } catch (error) {
      console.error('[bot] ошибка обработки сообщения:', error);
    }
  });

  await chat.connect();

  const shutdown = async () => {
    chat.quit();
    await prisma.$disconnect();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}
