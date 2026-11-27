import { isLotteryRunRequest } from '../../../../shared/admin';

// Запуск розыгрыша. Без { confirm: true } запрос не принимается: он сбрасывает победителей, билеты и недельный XP
export default defineAdminHandler(async (event) => {
  const body: unknown = await readBody(event);
  if (!isLotteryRunRequest(body)) throw createError({ statusCode: 400, statusMessage: 'Not confirmed' });
  return callBot<{ ok: true }>('/lottery', { confirm: true });
});
