import { parseTimerRequest } from '../../../../shared/admin';

export default defineAdminHandler(async (event) => {
  const request = parseTimerRequest(await readBody(event));
  if (!request) throw createError({ statusCode: 400, statusMessage: 'Bad timer request' });
  return callBot<{ ok: true }>('/timer', request);
});
