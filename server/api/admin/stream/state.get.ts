import type { AdminStreamState } from '../../../../shared/admin';

export default defineAdminHandler(() => callBot<AdminStreamState>('/state'));
