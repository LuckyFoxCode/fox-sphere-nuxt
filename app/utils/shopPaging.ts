// Витрина листается сама: оверлей в OBS некликабельный, поэтому героев больше трёх показываем страницами
// по три, каждая висит SHOP_PAGE_MS. Страница - чистая функция от номера, чтобы её можно было проверить без Vue.
export const SHOP_PAGE_SIZE = 3;
export const SHOP_PAGE_MS = 7000;

export const countPages = (total: number, size = SHOP_PAGE_SIZE): number => Math.max(1, Math.ceil(total / size));

export const pageSlice = <T>(items: readonly T[], page: number, size = SHOP_PAGE_SIZE): T[] =>
  items.slice(page * size, page * size + size);
