// Копирует data/prod.db -> data/dev.db (кроссплатформенно, Windows/Mac).
import { copyFileSync, existsSync, rmSync } from 'node:fs';

const src = 'data/prod.db';
const dst = 'data/dev.db';

if (!existsSync(src)) {
  console.error(`Нет файла ${src}`);
  process.exit(1);
}
for (const ext of ['-wal', '-shm']) rmSync(dst + ext, { force: true });
copyFileSync(src, dst);
console.log(`${src} -> ${dst}`);
