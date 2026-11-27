// Выбранный набор цветов админки. Хранится в браузере: у каждого устройства свой, база не нужна.
import { ADMIN_PALETTES, type AdminPaletteId } from '~/utils/adminPalettes';

const STORAGE_KEY = 'fox-admin-palette';

export const useAdminPalette = () => {
  const current = useState<AdminPaletteId>('admin-palette', () => {
    // Хранилище может быть недоступно (приватное окно): тогда набор по умолчанию
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return ADMIN_PALETTES.find((palette) => palette.id === saved)?.id ?? ADMIN_PALETTES[0].id;
    } catch {
      return ADMIN_PALETTES[0].id;
    }
  });

  // Nuxt UI перекрашивает интерфейс на ходу, без пересборки
  const apply = () => {
    const { primary, neutral } = ADMIN_PALETTES.find((palette) => palette.id === current.value)!;
    updateAppConfig({ ui: { colors: { primary, neutral } } });
  };

  const choose = (id: AdminPaletteId) => {
    current.value = id;
    apply();
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // Выбор действует до перезагрузки страницы
    }
  };

  return { current, apply, choose };
};
