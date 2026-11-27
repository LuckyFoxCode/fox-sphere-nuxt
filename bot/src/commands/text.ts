import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { prisma } from '../db';
import { language } from '../language';
import type { Command } from './types';

// Простые текстовые команды живут в таблице TextCommand (см. prisma/seed). Бот перечитывает её
// не чаще раза в TTL: правка в базе доезжает до чата без перезапуска.
const TTL_MS = 30_000;
const FALLBACK_LANG = 'en';

const root = resolve(fileURLToPath(import.meta.url), '../../../..');
const readVersion = (): string => {
  try {
    const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8')) as { version?: string };
    return pkg.version ?? 'dev';
  } catch {
    return 'dev';
  }
};

const stringList = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && item !== '') : [];

// {user} — ник без @ (в тексте пишут @{user}), {prefix} — префикс команд, {version} — версия проекта
export const renderText = (
  template: string,
  vars: { user: string; prefix: string; version: string },
): string => template.replace(/\{(user|prefix|version)\}/g, (_, key: keyof typeof vars) => vars[key]);

export const createTextCommands = (prefix: string) => {
  const version = readVersion();
  let loadedAt = 0;
  let loadedLang = language();
  let byName = new Map<string, Command>();

  const refresh = async () => {
    const lang = language();
    // Смена языка в админке перечитывает таблицу сразу, не дожидаясь TTL
    if (lang === loadedLang && Date.now() - loadedAt < TTL_MS) return;
    const rows = await prisma.textCommand.findMany({
      where: { enabled: true, lang: { in: [lang, FALLBACK_LANG] } },
    });
    // Строка на языке бота перекрывает английскую с тем же именем
    const chosen = new Map<string, (typeof rows)[number]>();
    for (const row of rows) {
      const current = chosen.get(row.name);
      if (!current || row.lang === lang) chosen.set(row.name, row);
    }

    const next = new Map<string, Command>();
    for (const row of chosen.values()) {
      const responses = stringList(row.responses);
      if (responses.length === 0) continue;
      const command: Command = {
        name: row.name,
        cooldownMs: row.cooldownMs,
        cooldownScope: row.scope === 'user' ? 'user' : 'global',
        run: async ({ displayName, reply }) => {
          const template = responses[Math.floor(Math.random() * responses.length)]!;
          await reply(renderText(template, { user: displayName, prefix, version }));
        },
      };
      for (const name of [row.name, ...stringList(row.aliases)]) next.set(name.toLowerCase(), command);
    }
    byName = next;
    loadedAt = Date.now();
    loadedLang = lang;
  };

  // Ошибка базы не должна ронять обработку сообщения: просто нет текстовых команд
  return async (name: string): Promise<Command | undefined> => {
    try {
      await refresh();
    } catch (error) {
      console.error('[bot] не удалось загрузить текстовые команды:', error);
    }
    return byName.get(name);
  };
};
