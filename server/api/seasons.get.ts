// Сезонные темы: режим и интенсивность. Без входа, как и /api/widgets: оверлей в OBS — браузер без сессии админки.
export default defineEventHandler(async (event) => {
  setHeader(event, 'cache-control', 'no-store');
  return getSeasons();
});
