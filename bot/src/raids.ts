import type { ApiClient } from '@twurple/api';
import { EventSubWsListener } from '@twurple/eventsub-ws';

// Чуть больше паузы между попытками внутри ensureBroadcaster (60 с)
const TOKEN_RETRY_MS = 65_000;

// Тип события берём из сигнатуры подписки: @twurple/eventsub-base не в зависимостях бота
type RaidEvent = Parameters<Parameters<EventSubWsListener['onChannelRaidTo']>[1]>[0];

type RaidListenerOptions = {
  api: ApiClient;
  streamerId: string;
  ensureBroadcaster: () => Promise<boolean>;
  onRaid: (event: RaidEvent) => Promise<void>;
};

// Входящие рейды (EventSub channel.raid по WebSocket). Особых прав не нужно, но подписка
// создаётся с токеном стримера: пока его нет, ждём, перезапуск не требуется.
export const startRaidListener = ({ api, streamerId, ensureBroadcaster, onRaid }: RaidListenerOptions) => {
  let listener: EventSubWsListener | undefined;
  let timer: NodeJS.Timeout | undefined;
  let stopped = false;

  const tryStart = async () => {
    try {
      if (await ensureBroadcaster()) {
        if (stopped) return;
        listener = new EventSubWsListener({ apiClient: api });
        listener.onSubscriptionCreateSuccess(() => console.log('[raid] слушаю входящие рейды'));
        listener.onSubscriptionCreateFailure((_subscription, error) => {
          console.error('[raid] не удалось подписаться на рейды:', error);
        });
        listener.onChannelRaidTo(streamerId, (event) => {
          onRaid(event).catch((error) => console.error('[raid] ошибка обработки рейда:', error));
        });
        listener.start();
        return;
      }
    } catch (error) {
      console.error('[raid] не удалось запустить приём рейдов:', error);
    }
    if (!stopped) timer = setTimeout(tryStart, TOKEN_RETRY_MS);
  };

  if (streamerId) void tryStart();
  else console.warn('[raid] TWITCH_USER_ID не задан: рейды не отслеживаются');

  return {
    stop: () => {
      stopped = true;
      clearTimeout(timer);
      listener?.stop();
    },
  };
};
