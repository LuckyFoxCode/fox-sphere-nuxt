// Какие виджеты сцены включены. Без входа: оверлей в OBS — обычный браузер без сессии админки, а отдаётся только список флагов.
export default defineEventHandler(async (event) => {
  setHeader(event, 'cache-control', 'no-store');
  return getWidgets();
});
