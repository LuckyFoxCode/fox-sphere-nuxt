import { isTestEventKind, parseTestName } from '../../../../shared/testEvents';

export default defineAdminHandler(async (event) => {
  const body = await readBody<{ kind?: unknown; username?: unknown } | null>(event);
  const username = parseTestName(body?.username);
  if (!isTestEventKind(body?.kind) || !username) {
    throw createError({ statusCode: 400, statusMessage: 'Bad test request' });
  }
  return callBot<{ ok: true }>('/test', { kind: body.kind, username });
});
