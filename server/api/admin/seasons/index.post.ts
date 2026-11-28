// Изменить режим и/или интенсивность одной сезонной темы. Оверлей перечитывает состояние раз в несколько секунд.
import { parseSeasonUpdate } from '../../../../shared/seasons';

export default defineAdminHandler(async (event) => {
  const update = parseSeasonUpdate(await readBody(event));
  if (!update) {
    throw createError({ statusCode: 400, statusMessage: 'Bad season update', data: { error: 'Такой темы или значения нет.' } });
  }
  return { ok: true, seasons: await setSeason(update) };
});
