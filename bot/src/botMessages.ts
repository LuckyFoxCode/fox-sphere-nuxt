import { randomUUID } from 'node:crypto';
import type { ApiClient } from '@twurple/api';
import type { ChatMessagePayload } from '../../shared/events';
import { emitEvent } from './socket';

// Цвет ника бота, если свой он в Twitch не выбирал (как в старом fox-sphere)
const DEFAULT_COLOR = '#94A3B8';

type BotOverlayOptions = {
  api: ApiClient;
  botUserId: string;
  // Канал (TWITCH_USER_ID). Пусто — бейдж модератора не проверяется
  streamerId: string;
  ensureBroadcaster: () => Promise<boolean>;
  badgeUrls: (badges: Map<string, string>) => string[];
};

// Сообщения самого бота для чата оверлея. Twitch не присылает отправленное обратно в то же
// IRC-соединение (в chat.onMessage свои ответы не попадают), поэтому бот кладёт их в оверлей сам.
export const createBotOverlayChat = ({
  api,
  botUserId,
  streamerId,
  ensureBroadcaster,
  badgeUrls,
}: BotOverlayOptions) => {
  // Бейдж и цвет необязательны: если Twitch их не отдал, сообщение всё равно показывается
  const loadColor = async () => {
    try {
      return (await api.chat.getColorForUser(botUserId)) || DEFAULT_COLOR;
    } catch (error) {
      console.error('[chat] не удалось получить цвет бота:', error);
      return DEFAULT_COLOR;
    }
  };

  // Список модераторов Twitch отдаёт только по токену стримера
  const loadIsMod = async () => {
    try {
      if (!streamerId || streamerId === botUserId || !(await ensureBroadcaster())) return false;
      const mods = await api.moderation.getModerators(streamerId, { userId: botUserId });
      return mods.data.length > 0;
    } catch (error) {
      console.error('[chat] не удалось проверить, модератор ли бот:', error);
      return false;
    }
  };

  const loadIdentity = async () => {
    const user = await api.users.getUserById(botUserId);
    if (!user) throw new Error(`аккаунт бота ${botUserId} не найден в Twitch`);
    const [color, isMod] = await Promise.all([loadColor(), loadIsMod()]);
    return { username: user.name, displayName: user.displayName, color, isMod };
  };

  // Запрашивается один раз; неудачная попытка не кэшируется
  let identity: ReturnType<typeof loadIdentity> | undefined;

  // Не бросает исключений: сообщение в Twitch уже отправлено, сбой оверлея только пишется в лог
  return async (
    text: string,
    announcement?: Pick<ChatMessagePayload, 'isAnnouncement' | 'announceColor'>,
  ): Promise<void> => {
    try {
      identity ??= loadIdentity();
      const { username, displayName, color, isMod } = await identity;
      emitEvent('chat:message', {
        id: randomUUID(),
        userId: botUserId,
        username,
        displayName,
        color,
        text,
        badges: isMod ? badgeUrls(new Map([['moderator', '1']])) : [],
        emotes: {},
        timestamp: Date.now(),
        userLvl: 1,
        isMod,
        isFollower: false,
        isFounder: false,
        isSubscriber: false,
        isVip: false,
        isPermanentVip: false,
        isBroadcaster: false,
        isBot: true,
        isHighlight: false,
        isAction: false,
        ...announcement,
      });
    } catch (error) {
      identity = undefined;
      console.error('[chat] сообщение бота не показано в оверлее:', error);
    }
  };
};
