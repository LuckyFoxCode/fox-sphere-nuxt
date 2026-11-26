// Забирает свежие данные из Postgres старого fox-sphere и накатывает их на data/prod.db.
// Старая база открывается ТОЛЬКО на чтение (pg_dump); токены Twitch не выгружаются.
//   pnpm db:sync-old            # пробный прогон: дамп + отчёт, база не меняется
//   pnpm db:sync-old --apply    # то же, но с записью (перед записью делается копия prod.db)
// Нужно в .env.production: OLD_SSH_HOST (например user@1.2.3.4 или имя из ~/.ssh/config).
// Необязательно: OLD_PG_CONTAINER (по умолчанию foxsphere-postgres), OLD_DB_FILE (по умолчанию data/prod.db).
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, renameSync, statSync, writeFileSync } from 'node:fs';

const apply = process.argv.includes('--apply');
const host = process.env.OLD_SSH_HOST;
const container = process.env.OLD_PG_CONTAINER || 'foxsphere-postgres';
const dbFile = process.env.OLD_DB_FILE || 'data/prod.db';
const dumpFile = 'data/prod-pg-dump.sql';

if (!host) {
  console.error('Не задан OLD_SSH_HOST в .env.production (ssh-адрес сервера старого бота).');
  process.exit(1);
}
if (!existsSync(dbFile)) {
  console.error(`Нет ${dbFile}. Сначала: pnpm db:push:prod`);
  process.exit(1);
}

// Только нужные таблицы; TwitchToken и legacy-таблицы не берём. Скрипт идёт в stdin, без экранирования кавычек.
const tables = ['Channel', 'Viewer', 'ChannelUser', 'UserHero', 'CoinHistory', 'XpHistory', 'WatchStreak', 'SystemState'];
const script =
  `pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --data-only --no-owner ` +
  tables.map((t) => `-t 'public."${t}"'`).join(' ') +
  '\n';

console.log(`Дамп со старой базы (только чтение): ssh ${host}, контейнер ${container}`);
const dump = spawnSync('ssh', [host, `docker exec -i ${container} sh -s`], {
  input: script,
  encoding: 'utf8',
  maxBuffer: 1024 * 1024 * 1024,
});
if (dump.status !== 0 || !dump.stdout.includes('-- PostgreSQL database dump complete')) {
  console.error('Дамп не получился или оборван:\n' + (dump.stderr || '(нет текста ошибки)'));
  process.exit(1);
}

mkdirSync('data', { recursive: true });
if (existsSync(dumpFile)) renameSync(dumpFile, `data/prod-pg-dump.previous.sql`);
writeFileSync(dumpFile, dump.stdout);
console.log(`Дамп записан: ${dumpFile} (${Math.round(statSync(dumpFile).size / 1024)} КБ)`);

const run = spawnSync(
  'pnpm',
  ['db:import', '--', '--db', dbFile, '--file', dumpFile, ...(apply ? ['--apply'] : [])],
  { stdio: 'inherit', shell: true },
);
process.exit(run.status ?? 1);
