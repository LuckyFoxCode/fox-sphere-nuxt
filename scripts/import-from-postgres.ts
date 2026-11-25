// Импорт зрителей из дампа Postgres старого fox-sphere в SQLite (соответствие полей: docs/spec.md, 1.2).
// Без --apply только показывает, что изменится. Повторный запуск ничего не дублирует.
//   pnpm db:import [--db data/dev.db] [--file data/prod-pg-dump.sql] [--channel luckyfoxcode] [--apply]
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import type { Prisma } from '../generated/prisma/client';
import { bool, date, int, optionalDate, optionalText, parsePgDump, text, type PgRow } from './pg-dump';

const root = resolve(fileURLToPath(import.meta.url), '../..');

const { values: args } = parseArgs({
  args: process.argv.slice(2).filter((arg) => arg !== '--'),
  options: {
    file: { type: 'string', default: 'data/prod-pg-dump.sql' },
    db: { type: 'string' },
    channel: { type: 'string', default: process.env.TWITCH_CHANNEL_NAME ?? 'luckyfoxcode' },
    apply: { type: 'boolean', default: false },
  },
});

if (args.db) process.env.DATABASE_URL = `file:${args.db}`;
const databaseUrl = process.env.DATABASE_URL ?? '';
if (!databaseUrl.startsWith('file:')) throw new Error('Нужна база SQLite: DATABASE_URL=file:... или --db');
const databasePath = resolve(root, databaseUrl.slice(5));
if (!existsSync(databasePath)) throw new Error(`Нет базы ${databasePath} (сначала pnpm db:push:dev)`);
const dumpPath = resolve(root, args.file);
if (!existsSync(dumpPath)) throw new Error(`Нет дампа ${dumpPath}`);

// --- Источник ---

const tables = parsePgDump(readFileSync(dumpPath, 'utf8'));
const table = (name: string): PgRow[] => {
  const rows = tables.get(name);
  if (!rows) throw new Error(`В дампе нет таблицы ${name}`);
  return rows;
};

const warnings: string[] = [];
const warn = (count: number, message: string) => {
  if (count > 0) warnings.push(`${message}: ${count}`);
};

const channels = table('Channel');
const channel = channels.find((c) => text(c, 'login').toLowerCase() === args.channel.toLowerCase());
if (!channel) {
  const logins = channels.map((c) => text(c, 'login')).join(', ') || 'пусто';
  throw new Error(`Канала ${args.channel} нет в дампе (есть: ${logins})`);
}
const channelId = text(channel, 'id');

const identities = new Map(table('Viewer').map((v) => [text(v, 'id'), v]));
const allChannelUsers = table('ChannelUser');
const channelUsers = allChannelUsers.filter((u) => text(u, 'channelId') === channelId);
warn(allChannelUsers.length - channelUsers.length, 'Записи других каналов (пропущены)');

// ChannelUser.id -> twitchId: по нему перестраиваются все связи
const twitchIdByChannelUser = new Map<string, string>();
const sourceViewers = new Map<string, Prisma.ViewerUncheckedCreateInput>();

for (const user of channelUsers) {
  const identity = identities.get(text(user, 'viewerId'));
  if (!identity) {
    warnings.push(`ChannelUser ${text(user, 'id')} без записи Viewer (пропущен)`);
    continue;
  }
  const twitchId = text(identity, 'twitchId');
  if (sourceViewers.has(twitchId)) throw new Error(`Два ChannelUser у одного twitchId ${twitchId}`);
  twitchIdByChannelUser.set(text(user, 'id'), twitchId);
  sourceViewers.set(twitchId, {
    twitchId,
    username: text(identity, 'username'),
    createdAt: date(identity, 'createdAt'),
    updatedAt: date(identity, 'updatedAt'),
    coins: int(user, 'coins'),
    lvl: int(user, 'lvl'),
    xp: int(user, 'xp'),
    lastXpAt: date(user, 'lastXpAt'),
    isMod: bool(user, 'isMod'),
    isFounder: bool(user, 'isFounder'),
    isSubscriber: bool(user, 'isSubscriber'),
    isPermanentVip: bool(user, 'isPermanentVip'),
    spinsCount: int(user, 'spinsCount'),
    goldenBeers: int(user, 'goldenBeers'),
    totalWin: int(user, 'totalWin'),
    totalLoss: int(user, 'totalLoss'),
    xpThisWeek: int(user, 'xpThisWeek'),
    hasTicket: bool(user, 'hasTicket'),
    isLuckyVip: bool(user, 'isLuckyVip'),
  });
}
warn(identities.size - sourceViewers.size, 'Viewer без баланса на этом канале (пропущены)');

const knownChannelUsers = new Set(allChannelUsers.map((u) => text(u, 'id')));

// Строки зависимой таблицы, привязанные к импортируемым зрителям
const dependent = (name: string): { twitchId: string; row: PgRow }[] => {
  let orphans = 0;
  let foreign = 0;
  let mismatched = 0;
  const result = [];
  for (const row of table(name)) {
    const channelUserId = text(row, 'channelUserId');
    const twitchId = twitchIdByChannelUser.get(channelUserId);
    if (!twitchId) {
      if (knownChannelUsers.has(channelUserId)) foreign++;
      else orphans++;
      continue;
    }
    if (text(row, 'channelId') !== channelId) mismatched++;
    result.push({ twitchId, row });
  }
  warn(orphans, `${name}: строки без владельца (пропущены)`);
  warn(foreign, `${name}: строки других каналов (пропущены)`);
  warn(mismatched, `${name}: channelId не совпадает с владельцем (перенесены по владельцу)`);
  return result;
};

const sourceHeroes = dependent('UserHero').map(({ twitchId, row }) => ({
  twitchId,
  heroId: text(row, 'heroId'),
  isActive: bool(row, 'isActive'),
  level: int(row, 'level'),
  xp: int(row, 'xp'),
  createdAt: date(row, 'createdAt'),
  updatedAt: date(row, 'updatedAt'),
}));

const sourceCoins = dependent('CoinHistory').map(({ twitchId, row }) => ({
  twitchId,
  amount: int(row, 'amount'),
  reason: text(row, 'reason'),
  details: optionalText(row, 'details'),
  redemptionId: optionalText(row, 'redemptionId'),
  createdAt: date(row, 'createdAt'),
}));

const sourceXp = dependent('XpHistory').map(({ twitchId, row }) => ({
  twitchId,
  amount: int(row, 'amount'),
  reason: text(row, 'reason'),
  details: optionalText(row, 'details'),
  createdAt: date(row, 'createdAt'),
}));

const sourceStreaks = dependent('WatchStreak').map(({ twitchId, row }) => ({
  twitchId,
  streakValue: int(row, 'streakValue'),
  createdAt: date(row, 'createdAt'),
}));

const activeCounts = new Map<string, number>();
for (const hero of sourceHeroes) {
  if (hero.isActive) activeCounts.set(hero.twitchId, (activeCounts.get(hero.twitchId) ?? 0) + 1);
}
warn([...activeCounts.values()].filter((n) => n > 1).length, 'Зрители с несколькими активными героями');

const systemRow = table('SystemState').find((r) => int(r, 'id') === 1);
const sourceSystem = systemRow && {
  id: 1,
  streamLevel: int(systemRow, 'streamLevel'),
  streamCurrentXp: int(systemRow, 'streamCurrentXp'),
  jackpotTotal: int(systemRow, 'jackpotTotal'),
  xpBoostMultiplier: int(systemRow, 'xpBoostMultiplier'),
  xpBoostExpiresAt: optionalDate(systemRow, 'xpBoostExpiresAt'),
  timerTitle: optionalText(systemRow, 'timerTitle'),
  timerColor: optionalText(systemRow, 'timerColor'),
  timerEndsAt: optionalDate(systemRow, 'timerEndsAt'),
  updatedAt: date(systemRow, 'updatedAt'),
};
if (!sourceSystem) warnings.push('В дампе нет SystemState: уровень стрима и джекпот не переносятся');

// --- Сравнение с целевой базой ---

type Db = Prisma.TransactionClient;

const same = (a: unknown, b: unknown) =>
  a instanceof Date && b instanceof Date ? a.getTime() === b.getTime() : a === b;
const differs = (source: object, target: object) =>
  Object.entries(source).some(([key, value]) => !same(value, (target as Record<string, unknown>)[key]));

// У истории нет общего ключа с источником, поэтому сравниваем содержимое строк с учётом повторов
const missingRows = <S, T>(source: S[], target: T[], sourceKey: (s: S) => string, targetKey: (t: T) => string) => {
  const available = new Map<string, number>();
  for (const row of target) available.set(targetKey(row), (available.get(targetKey(row)) ?? 0) + 1);
  return source.filter((row) => {
    const key = sourceKey(row);
    const left = available.get(key) ?? 0;
    if (left === 0) return true;
    available.set(key, left - 1);
    return false;
  });
};

const historyKey = (
  twitchId: string,
  row: { amount: number; reason: string; details: string | null; createdAt: Date },
) => JSON.stringify([twitchId, row.amount, row.reason, row.details, row.createdAt.getTime()]);

const buildPlan = async (db: Db) => {
  const viewers = await db.viewer.findMany();
  const byTwitchId = new Map(viewers.map((v) => [v.twitchId, v]));
  const twitchIdById = new Map(viewers.map((v) => [v.id, v.twitchId]));
  const owner = (viewerId: number) => twitchIdById.get(viewerId)!;

  const newViewers = [...sourceViewers.values()].filter((v) => !byTwitchId.has(v.twitchId));
  const changedViewers = [...sourceViewers.values()].filter((v) => {
    const current = byTwitchId.get(v.twitchId);
    return current !== undefined && differs(v, current);
  });

  const heroKey = (twitchId: string, heroId: string) => JSON.stringify([twitchId, heroId]);
  const heroes = await db.viewerHero.findMany();
  const targetHeroes = new Map(heroes.map((h) => [heroKey(owner(h.viewerId), h.heroId), h]));
  const sourceHeroKeys = new Set(sourceHeroes.map((h) => heroKey(h.twitchId, h.heroId)));
  const newHeroes = sourceHeroes.filter((h) => !targetHeroes.has(heroKey(h.twitchId, h.heroId)));
  const changedHeroes = sourceHeroes.filter((h) => {
    const current = targetHeroes.get(heroKey(h.twitchId, h.heroId));
    if (!current) return false;
    const { twitchId: _, ...fields } = h;
    return differs(fields, current);
  });
  // Локальный активный герой уступает активному из источника, иначе активных станет два
  const heroesToDeactivate = heroes.filter(
    (h) =>
      h.isActive &&
      activeCounts.has(owner(h.viewerId)) &&
      !sourceHeroKeys.has(heroKey(owner(h.viewerId), h.heroId)),
  );

  const coinRows = await db.coinHistory.findMany();
  const usedRedemptions = new Set(coinRows.flatMap((r) => (r.redemptionId ? [r.redemptionId] : [])));
  const unmatchedCoins = missingRows(
    sourceCoins,
    coinRows,
    (s) => historyKey(s.twitchId, s),
    (t) => historyKey(owner(t.viewerId), t),
  );
  const newCoins = unmatchedCoins.filter((r) => !r.redemptionId || !usedRedemptions.has(r.redemptionId));

  const newXp = missingRows(
    sourceXp,
    await db.xpHistory.findMany(),
    (s) => historyKey(s.twitchId, s),
    (t) => historyKey(owner(t.viewerId), t),
  );

  const streakKey = (twitchId: string, value: number) => JSON.stringify([twitchId, value]);
  const targetStreaks = new Set(
    (await db.watchStreak.findMany()).map((s) => streakKey(owner(s.viewerId), s.streakValue)),
  );
  const newStreaks = sourceStreaks.filter((s) => !targetStreaks.has(streakKey(s.twitchId, s.streakValue)));

  const system = await db.systemState.findUnique({ where: { id: 1 } });
  const systemChanged = sourceSystem !== undefined && (!system || differs(sourceSystem, system));

  return {
    byTwitchId,
    newViewers,
    changedViewers,
    localOnlyViewers: viewers.filter((v) => !sourceViewers.has(v.twitchId)),
    newHeroes,
    changedHeroes,
    heroesToDeactivate,
    newCoins,
    skippedRedemptions: unmatchedCoins.length - newCoins.length,
    newXp,
    newStreaks,
    system,
    systemChanged,
  };
};

type Plan = Awaited<ReturnType<typeof buildPlan>>;

const pendingChanges = (plan: Plan) =>
  plan.newViewers.length +
  plan.changedViewers.length +
  plan.newHeroes.length +
  plan.changedHeroes.length +
  plan.heroesToDeactivate.length +
  plan.newCoins.length +
  plan.newXp.length +
  plan.newStreaks.length +
  (plan.systemChanged ? 1 : 0);

// --- Отчёт ---

const sum = <T>(rows: T[], pick: (row: T) => number | undefined) =>
  rows.reduce((total, row) => total + (pick(row) ?? 0), 0);

const report = (plan: Plan) => {
  const viewers = [...sourceViewers.values()];
  console.log('\nВ дампе (канал ' + args.channel + '):');
  console.log(`  зрителей ${viewers.length}, монет ${sum(viewers, (v) => v.coins)}, XP ${sum(viewers, (v) => v.xp)}`);
  console.log(`  история монет ${sourceCoins.length} (сумма ${sum(sourceCoins, (r) => r.amount)})`);
  console.log(`  история XP ${sourceXp.length} (сумма ${sum(sourceXp, (r) => r.amount)})`);
  console.log(`  watch streak ${sourceStreaks.length}, героев ${sourceHeroes.length}`);
  const heroIds = new Map<string, number>();
  for (const h of sourceHeroes) heroIds.set(h.heroId, (heroIds.get(h.heroId) ?? 0) + 1);
  if (heroIds.size) console.log(`  heroId: ${[...heroIds].map(([id, n]) => `${id} ×${n}`).join(', ')}`);

  console.log('\nЧто изменится в базе:');
  console.log(`  зрители: новых ${plan.newViewers.length}, обновится ${plan.changedViewers.length}`);
  console.log(`  только в этой базе (не трогаем): ${plan.localOnlyViewers.length}`);
  console.log(`  герои: новых ${plan.newHeroes.length}, обновится ${plan.changedHeroes.length}, снимется активных ${plan.heroesToDeactivate.length}`);
  console.log(`  новых строк: история монет ${plan.newCoins.length}, история XP ${plan.newXp.length}, watch streak ${plan.newStreaks.length}`);
  if (sourceSystem) {
    const show = (s: { streamLevel: number; streamCurrentXp: number; jackpotTotal: number }) =>
      `уровень стрима ${s.streamLevel}, XP ${s.streamCurrentXp}, джекпот ${s.jackpotTotal}`;
    console.log(
      plan.systemChanged
        ? `  SystemState: ${plan.system ? show(plan.system) : 'нет'} -> ${show(sourceSystem)}`
        : '  SystemState: без изменений',
    );
  }

  const overwritten = plan.changedViewers.filter((v) => {
    const current = plan.byTwitchId.get(v.twitchId)!;
    return current.coins !== v.coins || current.xp !== v.xp || current.lvl !== v.lvl;
  });
  if (overwritten.length) {
    console.log(`\nБаланс будет перезаписан значениями из дампа у ${overwritten.length}:`);
    for (const v of overwritten.slice(0, 10)) {
      const c = plan.byTwitchId.get(v.twitchId)!;
      console.log(`  ${v.username}: монеты ${c.coins} -> ${v.coins}, XP ${c.xp} -> ${v.xp}, уровень ${c.lvl} -> ${v.lvl}`);
    }
    if (overwritten.length > 10) console.log(`  ... и ещё ${overwritten.length - 10}`);
  }

  const problems = [...warnings];
  if (plan.skippedRedemptions) {
    problems.push(`Награды за баллы с уже занятым redemptionId (пропущены): ${plan.skippedRedemptions}`);
  }
  console.log(problems.length ? `\nНе сошлось:\n  ${problems.join('\n  ')}` : '\nРасхождений в данных нет.');
};

// --- Запись ---

const apply = async (db: Db, plan: Plan) => {
  for (const data of [...plan.newViewers, ...plan.changedViewers]) {
    await db.viewer.upsert({ where: { twitchId: data.twitchId }, create: data, update: data });
  }
  const ids = new Map(
    (await db.viewer.findMany({ select: { id: true, twitchId: true } })).map((v) => [v.twitchId, v.id]),
  );
  const link = <T extends { twitchId: string }>({ twitchId, ...row }: T) => ({
    ...row,
    viewerId: ids.get(twitchId)!,
  });

  for (const hero of plan.heroesToDeactivate) {
    await db.viewerHero.update({ where: { id: hero.id }, data: { isActive: false } });
  }
  for (const hero of [...plan.newHeroes, ...plan.changedHeroes]) {
    const data = link(hero);
    await db.viewerHero.upsert({
      where: { viewerId_heroId: { viewerId: data.viewerId, heroId: data.heroId } },
      create: data,
      update: data,
    });
  }

  const chunks = <T>(rows: T[]) =>
    Array.from({ length: Math.ceil(rows.length / 500) }, (_, i) => rows.slice(i * 500, (i + 1) * 500));
  for (const rows of chunks(plan.newCoins)) await db.coinHistory.createMany({ data: rows.map(link) });
  for (const rows of chunks(plan.newXp)) await db.xpHistory.createMany({ data: rows.map(link) });
  for (const rows of chunks(plan.newStreaks)) await db.watchStreak.createMany({ data: rows.map(link) });

  if (plan.systemChanged && sourceSystem) {
    await db.systemState.upsert({ where: { id: 1 }, create: sourceSystem, update: sourceSystem });
  }
};

// Клиент создаётся при импорте модуля, поэтому только после разбора --db
const { prisma } = await import('../bot/src/db');

try {
  console.log(`Дамп: ${dumpPath}\nБаза: ${databasePath}`);
  console.log(args.apply ? 'Режим: ЗАПИСЬ' : 'Режим: пробный прогон, в базу ничего не пишется');
  const plan = await buildPlan(prisma);
  report(plan);

  if (!args.apply) {
    console.log('\nЧтобы записать, повторите с --apply.');
  } else if (pendingChanges(plan) === 0) {
    console.log('\nЗаписывать нечего: база уже совпадает с дампом.');
  } else {
    const backup = `${databasePath.replace(/\.db$/, '')}.backup-${new Date().toISOString().replace(/[:.]/g, '-')}.db`;
    await prisma.$executeRawUnsafe(`VACUUM INTO '${backup.replaceAll('\\', '/').replaceAll("'", "''")}'`);
    console.log(`\nКопия базы до импорта: ${backup}`);

    await prisma.$transaction(
      async (tx) => {
        await apply(tx, plan);
        // Проверка до фиксации: после записи расхождений с дампом остаться не должно
        const left = pendingChanges(await buildPlan(tx));
        if (left > 0) throw new Error(`Проверка не пройдена (расхождений: ${left}), изменения отменены`);
        const imported = await tx.viewer.findMany({ where: { twitchId: { in: [...sourceViewers.keys()] } } });
        const source = [...sourceViewers.values()];
        const totals = [
          ['зрителей', source.length, imported.length],
          ['монет', sum(source, (v) => v.coins), sum(imported, (v) => v.coins)],
          ['XP', sum(source, (v) => v.xp), sum(imported, (v) => v.xp)],
        ] as const;
        console.log('\nСверка (дамп / база):');
        for (const [name, expected, actual] of totals) {
          console.log(`  ${name}: ${expected} / ${actual}`);
          if (expected !== actual) throw new Error(`Не сошлось: ${name}, изменения отменены`);
        }
      },
      { maxWait: 10_000, timeout: 600_000 },
    );
    console.log('\nИмпорт записан.');
  }
} finally {
  await prisma.$disconnect();
}
