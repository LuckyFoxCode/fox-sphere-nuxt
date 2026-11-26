import { prisma } from './db';

// Founder — это бейдж Twitch для первых подписчиков, но API его не отдаёт и не выдаёт, поэтому
// флаг живёт только в базе и ставится руками (!addfounder). Он даёт бонус XP за сообщения.
// Как и у VIP, зритель может получить статус, ещё ни разу не написав в чат: строка создаётся здесь.
export const setFounder = async (twitchId: string, username: string, value: boolean): Promise<void> => {
  await prisma.viewer.upsert({
    where: { twitchId },
    create: { twitchId, username, isFounder: value, lastXpAt: new Date(0) },
    update: { username, isFounder: value },
  });
};
