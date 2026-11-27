import { parseBoostRequest } from '../../../../shared/admin';

export default defineAdminHandler(async (event) => {
  const request = parseBoostRequest(await readBody(event));
  if (!request) throw createError({ statusCode: 400, statusMessage: 'Bad boost request' });
  return callBot<{ ok: true }>('/boost', request);
});
