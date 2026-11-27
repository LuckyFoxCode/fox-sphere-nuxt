// Сделать копию базы сейчас. Старые копии не удаляются.
export default defineAdminHandler(async () => {
  try {
    return { name: await createBackup() };
  } catch (error) {
    // Отказ с готовой причиной (не тот тип базы) идёт как есть
    if ((error as { statusCode?: number }).statusCode) throw error;
    console.error('[admin] копия базы не сделана:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Backup failed',
      data: { error: 'Копия не сделана: проверьте место на диске. Подробности в логе сайта.' },
    });
  }
});
