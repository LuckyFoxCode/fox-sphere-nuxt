import { prisma } from './db';

// Два вида VIP живут в разных полях, и это важно для лотереи (её ещё нет):
//  - isPermanentVip — постоянный, выдан руками (!addvip), лотерея его не трогает и не снимает;
//  - isLuckyVip — временный, его ставит и сбрасывает лотерея (раз в неделю, без срока в базе).
// Команды ниже пишут только постоянный. Сам бейдж в чате даёт Twitch, а не эти поля.

// Зритель может получить VIP, ещё ни разу не написав в чат: строка создаётся, как при первом сообщении
export const setPermanentVip = async (twitchId: string, username: string, value: boolean): Promise<void> => {
  await prisma.viewer.upsert({
    where: { twitchId },
    create: { twitchId, username, isPermanentVip: value, lastXpAt: new Date(0) },
    // На Twitch VIP снят целиком, поэтому «временный» флаг при снятии тоже гасим: он без бейджа бессмыслен
    update: { username, isPermanentVip: value, ...(value ? {} : { isLuckyVip: false }) },
  });
};
