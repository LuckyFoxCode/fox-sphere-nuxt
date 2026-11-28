// Включить или выключить один виджет сцены. Оверлей перечитывает список раз в несколько секунд.
import { parseWidgetUpdate } from '../../../../shared/widgets';

export default defineAdminHandler(async (event) => {
  const update = parseWidgetUpdate(await readBody(event));
  if (!update) {
    throw createError({ statusCode: 400, statusMessage: 'Bad widget update', data: { error: 'Такого виджета нет.' } });
  }
  return { ok: true, widgets: await setWidget(update.id, update.enabled) };
});
