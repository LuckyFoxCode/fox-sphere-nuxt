// Тексты, цвета, звуки и длительность алертов. Один стикер на всех, события отличаются только данными.
// follow, raid и reward перенесены из старого fox-sphere как есть; подписок там не было.
import type { FollowPayload, RaidPayload, RewardRedeemPayload, SubPayload, SubTier } from '#shared/events';

export type AlertKind = 'follow' | 'raid' | 'reward' | 'sub';

export interface AlertView {
  kind: AlertKind;
  /** Классы бумаги пластины целиком: `bg-paper-${x}` Tailwind не увидит */
  paper: string;
  label: string;
  title: string;
  detail?: string;
  /** Крупное число в плитке справа: месяцы подписки, число подарков */
  stat?: { value: string; unit: string };
  chips?: string[];
  /** Адрес звука из public/; null — алерт без звука */
  sound: string | null;
  durationMs: number;
}

const ALERT_DURATION_MS = 5000;

export const ALERT_SOUNDS: Record<AlertKind, string | null> = {
  follow: '/assets/sound/follow.mp3',
  raid: '/assets/sound/raid.mp3',
  reward: '/assets/sound/knock.wav',
  // Заглушка: в старом проекте звука подписки не было. Положите файл в public/assets/sound/
  // и впишите его адрес сюда.
  sub: null,
};

const plural = (count: number, word: string): string => (count === 1 ? word : `${word}s`);

// Уровень подписки стоит в микролейбле: отдельный чип делал стикер выше остальных
const withTier = (label: string, tier: SubTier): string => `${label} · tier ${tier[0]}`;

export const followAlert = ({ username }: FollowPayload): AlertView => ({
  kind: 'follow',
  paper: 'bg-paper-red',
  label: 'new follower',
  title: username,
  detail: 'welcome to the sphere',
  sound: ALERT_SOUNDS.follow,
  durationMs: ALERT_DURATION_MS,
});

export const raidAlert = ({ raiderName, viewers }: RaidPayload): AlertView => ({
  kind: 'raid',
  paper: 'bg-paper-cyan',
  label: 'raid incoming',
  title: raiderName,
  detail: 'welcome to the sphere',
  chips: [`${viewers} ${plural(viewers, 'viewer')}`],
  sound: ALERT_SOUNDS.raid,
  durationMs: ALERT_DURATION_MS,
});

export const rewardAlert = ({ username, rewardTitle }: RewardRedeemPayload): AlertView => ({
  kind: 'reward',
  paper: 'bg-paper-purple',
  label: 'reward redeemed',
  title: username,
  chips: [rewardTitle],
  sound: ALERT_SOUNDS.reward,
  durationMs: ALERT_DURATION_MS,
});

export const subAlert = (sub: SubPayload): AlertView => {
  const common = {
    kind: 'sub',
    paper: 'bg-paper-rose',
    sound: ALERT_SOUNDS.sub,
    durationMs: ALERT_DURATION_MS,
  } as const;

  switch (sub.kind) {
    case 'new':
      return {
        ...common,
        label: withTier('new subscriber', sub.tier),
        title: sub.username,
        detail: 'welcome to the sphere',
      };
    case 'resub':
      return {
        ...common,
        label: withTier('resubscribed', sub.tier),
        title: sub.username,
        detail: 'welcome back to the sphere',
        stat: { value: String(sub.months), unit: plural(sub.months, 'month') },
      };
    case 'gift':
      return {
        ...common,
        label: withTier('gift subs', sub.tier),
        title: sub.username ?? 'anonymous',
        detail: 'gifted to the sphere',
        stat: { value: `x${sub.amount}`, unit: plural(sub.amount, 'sub') },
      };
  }
};
