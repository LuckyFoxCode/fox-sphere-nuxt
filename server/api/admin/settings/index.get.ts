import type { AdminSettings } from '../../../../shared/settings';

export default defineAdminHandler(async (): Promise<AdminSettings> => {
  const [botLang, accounts] = await Promise.all([getBotLang(), getTwitchAccounts()]);
  return { botLang, accounts };
});
