// Примеры карточки профиля для страниц /dev: полная и «новичок без героя».
// Полная живёт в shared/testEvents.ts: ту же карточку шлют тестовые кнопки админки.
import type { ProfileShowPayload } from '#shared/events';
import { PROFILE_SAMPLE } from '#shared/testEvents';

export { PROFILE_SAMPLE };

export const PROFILE_SPARSE: ProfileShowPayload = {
  ...PROFILE_SAMPLE,
  userId: 'dev-newviewer',
  username: 'newviewer',
  displayName: 'NewViewer',
  color: '#9146FF',
  lvl: 2,
  xp: 130,
  startXp: 100,
  maxXp: 300,
  coins: 40,
  heroId: null,
  heroLevel: null,
  bestStreak: null,
  goldenBeers: 0,
  isFounder: false,
  isSubscriber: false,
  isLuckyVip: false,
  isFollower: false,
  earned: 1,
  badges: [{ category: 'spins', level: 1, rarity: 1, value: 3 }],
};
