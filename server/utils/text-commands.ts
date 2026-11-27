// Текстовые команды для админки: строки TextCommand (по одной на язык) складываются в одну команду.
import type { TextCommand } from '../../generated/prisma/client';
import { type AdminTextCommand, resolveCommandPrefix } from '../../shared/commands';
import { LANGS, type Lang } from '../../shared/i18n';

export const commandPrefix = (): string => resolveCommandPrefix(process.env.COMMAND_PREFIX, process.env.NODE_ENV);

export const stringList = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];

// Все строки одной команды. Алиасы, кулдаун и состояние берутся так же, как их берёт бот:
// строка на языке бота, без неё английская (bot/src/commands/text.ts)
export const toAdminCommand = (rows: TextCommand[], botLang: Lang): AdminTextCommand => {
  const byLang = new Map(rows.map((row) => [row.lang, row]));
  const active = [byLang.get(botLang), byLang.get('en')].filter((row) => row !== undefined);
  const main = active.find((row) => row.enabled) ?? active[0] ?? rows[0]!;
  const responses = {} as Record<Lang, string[]>;
  for (const lang of LANGS) responses[lang] = stringList(byLang.get(lang)?.responses);

  return {
    name: main.name,
    aliases: stringList(main.aliases),
    cooldownMs: main.cooldownMs,
    scope: main.scope === 'user' ? 'user' : 'global',
    enabled: active.some((row) => row.enabled),
    mixed: new Set(rows.map((row) => row.enabled)).size > 1,
    responses,
  };
};
