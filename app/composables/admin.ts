// Общее для страниц админки: кто вошёл и запросы к /api/admin с понятной ошибкой.

export const useAdminLogin = () => useState<string>('admin-login', () => '');

type ApiError = { statusCode?: number; data?: { data?: { error?: string } } };

export const adminErrorText = (error: unknown): string =>
  (error as ApiError).data?.data?.error ?? 'Не получилось выполнить запрос. Подробности в логе сервера.';

export const useAdminApi = () => {
  const toast = useToast();

  // 401 — сессия кончилась: уходим на вход
  const leaveIfSignedOut = async (error: unknown): Promise<boolean> => {
    if ((error as ApiError).statusCode !== 401) return false;
    await navigateTo('/admin/login');
    return true;
  };

  // Действие кнопки: true — выполнено, об успехе и отказе сообщает всплывающая подсказка
  const act = async (url: string, body: Record<string, unknown> | undefined, done: string): Promise<boolean> => {
    try {
      await $fetch(url, { method: 'POST', body });
      toast.add({ title: done, color: 'success', icon: 'i-lucide-check' });
      return true;
    } catch (error) {
      if (!(await leaveIfSignedOut(error))) {
        toast.add({ title: adminErrorText(error), color: 'error', icon: 'i-lucide-triangle-alert' });
      }
      return false;
    }
  };

  return { act, leaveIfSignedOut };
};
