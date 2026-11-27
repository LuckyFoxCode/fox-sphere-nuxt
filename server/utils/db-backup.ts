// Резервные копии базы SQLite рядом с ней самой: <имя>.backup-<дата>.db. Копия делается через
// VACUUM INTO: она целостная вместе с WAL, даже пока бот пишет в базу. В копии лежат и токены Twitch,
// поэтому через браузер файлы не отдаются.
import { readdir, stat } from 'node:fs/promises';
import { basename, dirname, join, resolve } from 'node:path';
import type { AdminBackups } from '../../shared/settings';

// Тот же файл, что открывает server/utils/prisma.ts
const databaseFile = (): string => {
  const url = process.env.DATABASE_URL ?? '';
  if (!url.startsWith('file:')) {
    throw createError({
      statusCode: 501,
      statusMessage: 'Backup needs a file database',
      data: { error: 'Копия возможна только для базы SQLite в файле (DATABASE_URL=file:…).' },
    });
  }
  return resolve(process.cwd(), url.slice(5));
};

const backupPrefix = (file: string): string => `${basename(file, '.db')}.backup-`;

export const listBackups = async (): Promise<AdminBackups> => {
  const file = databaseFile();
  const folder = dirname(file);
  const prefix = backupPrefix(file);
  const names = (await readdir(folder)).filter((name) => name.startsWith(prefix) && name.endsWith('.db'));
  const items = await Promise.all(
    names.map(async (name) => {
      const info = await stat(join(folder, name));
      return { name, createdAt: info.mtime.toISOString(), size: info.size };
    }),
  );
  items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return { folder, database: basename(file), items };
};

export const createBackup = async (): Promise<string> => {
  const file = databaseFile();
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const name = `${backupPrefix(file)}${stamp}.db`;
  // Путь в SQL-строке: прямые слэши и удвоенные кавычки
  const target = join(dirname(file), name).replaceAll('\\', '/').replaceAll("'", "''");
  await prisma.$executeRawUnsafe(`VACUUM INTO '${target}'`);
  return name;
};
