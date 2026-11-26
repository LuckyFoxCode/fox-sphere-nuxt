// Заполняет TextCommand: шаблоны из prisma/seed/commands.default.json (без личных ссылок), поверх них
// личные тексты из prisma/seed/commands.local.json (в git не лежит). Запись, которая уже есть в базе,
// не трогается — правки из базы переживают повторный сид; --force перезаписывает их файлом.
//   pnpm db:seed:dev [--force]      pnpm db:seed:prod [--force]
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { prisma } from '../bot/src/db';

type SeedCommand = {
  name: string;
  lang?: string;
  aliases?: string[];
  responses: string[];
  enabled?: boolean;
  cooldownMs?: number;
  scope?: 'global' | 'user';
};

const dir = resolve(fileURLToPath(import.meta.url), '../../prisma/seed');
const force = process.argv.includes('--force');

const read = (file: string): SeedCommand[] => {
  const path = resolve(dir, file);
  return existsSync(path) ? (JSON.parse(readFileSync(path, 'utf8')) as SeedCommand[]) : [];
};

const merged = new Map<string, SeedCommand>();
for (const command of [...read('commands.default.json'), ...read('commands.local.json')]) {
  merged.set(`${command.name}:${command.lang ?? 'en'}`, command);
}
const usedLocal = existsSync(resolve(dir, 'commands.local.json'));
console.log(`[seed] ${merged.size} команд (${usedLocal ? 'шаблоны + commands.local.json' : 'только шаблоны'})`);

for (const command of merged.values()) {
  const lang = command.lang ?? 'en';
  const data = {
    aliases: command.aliases ?? [],
    responses: command.responses,
    enabled: command.enabled ?? true,
    cooldownMs: command.cooldownMs ?? 10_000,
    scope: command.scope ?? 'global',
  };
  const where = { name_lang: { name: command.name, lang } };
  const exists = await prisma.textCommand.findUnique({ where });
  if (exists && !force) {
    console.log(`[seed] ${command.name} (${lang}): уже есть, пропуск`);
    continue;
  }
  await prisma.textCommand.upsert({ where, create: { name: command.name, lang, ...data }, update: data });
  console.log(`[seed] ${command.name} (${lang}): ${exists ? 'обновлена' : 'создана'}`);
}
await prisma.$disconnect();
