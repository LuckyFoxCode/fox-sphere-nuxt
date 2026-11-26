import type { ApiClient } from '@twurple/api';
import { EventSubWsListener } from '@twurple/eventsub-ws';
import type { BitsPayload, FollowPayload, RaidPayload, RewardRedeemPayload, SubPayload } from '../../shared/events';

// Чуть больше паузы между попытками внутри ensureBroadcaster (60 с)
const TOKEN_RETRY_MS = 65_000;
// Как в старом боте: повторный follow того же зрителя в течение минуты пропускается
const FOLLOW_COOLDOWN_MS = 60_000;

type Handler<T> = (payload: T) => Promise<void> | void;

type EventSubOptions = {
  api: ApiClient;
  streamerId: string;
  ensureBroadcaster: () => Promise<boolean>;
  onFollow: Handler<FollowPayload>;
  onRaid: Handler<RaidPayload>;
  onRewardRedeem: Handler<RewardRedeemPayload>;
  onSub: Handler<SubPayload>;
  onBits: Handler<BitsPayload>;
};

// События канала по EventSub WebSocket: фолловы, входящие рейды, награды за баллы и подписки.
// Все подписки идут через одно соединение и создаются с токеном стримера: пока его нет, ждём,
// перезапуск не требуется. Отказ одной подписки (нет права) остальным не мешает.
export const startEventSub = (options: EventSubOptions) => {
  const { api, streamerId, ensureBroadcaster } = options;
  let listener: EventSubWsListener | undefined;
  let timer: NodeJS.Timeout | undefined;
  let stopped = false;

  const run = <T>(what: string, handler: Handler<T>, payload: T): void => {
    void (async () => handler(payload))().catch((error) =>
      console.error(`[eventsub] ошибка обработки события ${what}:`, error),
    );
  };

  const lastFollowAt = new Map<string, number>();

  const subscribe = (ws: EventSubWsListener) => {
    // Нужен moderator:read:followers; модератором в запросе выступает сам стример
    ws.onChannelFollow(streamerId, streamerId, (event) => {
      const now = Date.now();
      if (now - (lastFollowAt.get(event.userId) ?? 0) < FOLLOW_COOLDOWN_MS) return;
      lastFollowAt.set(event.userId, now);
      run('follow', options.onFollow, { userId: event.userId, username: event.userDisplayName });
    });

    ws.onChannelRaidTo(streamerId, (event) => {
      run('raid', options.onRaid, {
        raiderId: event.raidingBroadcasterId,
        raiderName: event.raidingBroadcasterDisplayName,
        viewers: event.viewers,
      });
    });

    // Нужен channel:read:redemptions
    ws.onChannelRedemptionAdd(streamerId, (event) => {
      run('reward', options.onRewardRedeem, {
        userId: event.userId,
        username: event.userDisplayName,
        rewardTitle: event.rewardTitle,
        redemptionId: event.id,
      });
    });

    // Bits: нужен bits:read (он уже в правах стримера)
    ws.onChannelCheer(streamerId, (event) => {
      run('bits', options.onBits, {
        username: event.isAnonymous ? null : event.userDisplayName,
        bits: event.bits,
      });
    });

    // Подписки: нужен channel:read:subscriptions
    ws.onChannelSubscription(streamerId, (event) => {
      // Получатели подарка не алертятся по одному: о подарке сообщает событие дарителя
      if (event.isGift) return;
      run('sub', options.onSub, {
        kind: 'new',
        userId: event.userId,
        username: event.userDisplayName,
        tier: event.tier,
      });
    });

    ws.onChannelSubscriptionMessage(streamerId, (event) => {
      run('resub', options.onSub, {
        kind: 'resub',
        userId: event.userId,
        username: event.userDisplayName,
        tier: event.tier,
        months: event.cumulativeMonths,
      });
    });

    ws.onChannelSubscriptionGift(streamerId, (event) => {
      run('gift', options.onSub, {
        kind: 'gift',
        username: event.isAnonymous ? null : event.gifterDisplayName,
        tier: event.tier,
        amount: event.amount,
      });
    });
  };

  const tryStart = async () => {
    try {
      if (await ensureBroadcaster()) {
        if (stopped) return;
        listener = new EventSubWsListener({ apiClient: api });
        listener.onSubscriptionCreateSuccess((subscription) => {
          console.log(`[eventsub] подписка создана: ${subscription.id}`);
        });
        listener.onSubscriptionCreateFailure((subscription, error) => {
          console.error(
            `[eventsub] подписка не создана: ${subscription.id}. Если не хватает прав, войдите заново под стримером`,
            error,
          );
        });
        subscribe(listener);
        listener.start();
        return;
      }
    } catch (error) {
      console.error('[eventsub] не удалось запустить приём событий:', error);
    }
    if (!stopped) timer = setTimeout(tryStart, TOKEN_RETRY_MS);
  };

  if (streamerId) void tryStart();
  else console.warn('[eventsub] TWITCH_USER_ID не задан: фолловы, рейды, награды и подписки не отслеживаются');

  return {
    stop: () => {
      stopped = true;
      clearTimeout(timer);
      listener?.stop();
    },
  };
};
