// Команды чата: список команд из кода (имена и алиасы бот берёт отсюда), группы и описания для
// раздела админки «Команды», префикс и проверка правок текстовых команд.
import { LANGS, type Lang } from './i18n';

// Минимальная роль: команду модератора может вызвать и стример
export type CommandRole = 'viewer' | 'moderator' | 'broadcaster';

export const COMMAND_ROLES: Record<CommandRole, string> = {
  viewer: 'Все зрители',
  moderator: 'Модератор и стример',
  broadcaster: 'Только стример',
};

// Порядок групп на странице
export const COMMAND_CATEGORIES = [
  {
    id: 'about',
    title: 'О канале и проекте',
    description: 'Ссылки и личные тексты. Замените шаблоны своими.',
  },
  { id: 'chat', title: 'Справка и чат', description: 'Список команд, версия бота и лурк.' },
  { id: 'coins', title: 'Монеты и профиль', description: 'Баланс, карточка зрителя и как заработать монеты.' },
  { id: 'spin', title: 'Рулетка', description: 'Игра на монеты и статистика зрителя.' },
  { id: 'fish', title: 'Рыбалка', description: 'Бесплатная игра: улов с монетами, XP или сундуком в банк.' },
  { id: 'pivo', title: 'Пиво', description: 'Обычная фраза или редкое золотое пиво.' },
  { id: 'hero', title: 'Герои', description: 'Покупка героя за монеты, смена активного и витрина на оверлее.' },
  { id: 'tower', title: 'Башня', description: 'Бой героя на этаже башни, награды и очередь на оверлее.' },
  { id: 'lottery', title: 'Лотерея VIP', description: 'Билеты за недельный XP и розыгрыш временного VIP.' },
  { id: 'vip', title: 'VIP', description: 'Выдача и снятие VIP.' },
  { id: 'founder', title: 'Founder', description: 'Статус основателя с бонусом XP.' },
  { id: 'boost', title: 'Буст XP', description: 'Временное умножение XP за сообщения.' },
  { id: 'timer', title: 'Таймер', description: 'Таймер на оверлее.' },
  { id: 'other', title: 'Прочие текстовые команды', description: 'Команды из базы, которых нет в шаблонах.' },
] as const;

export type CommandCategoryId = (typeof COMMAND_CATEGORIES)[number]['id'];

type CodeCommandMeta = {
  aliases: readonly string[];
  // Право проверяет сама команда (bot/src/commands/): меняя проверку там, поменяйте и здесь
  role: CommandRole;
  category: CommandCategoryId;
  description: string;
};

export const CODE_COMMANDS = {
  coins: { aliases: ['balance', 'монеты'], role: 'viewer', category: 'coins', description: 'Баланс монет зрителя.' },
  profile: {
    aliases: ['профиль'],
    role: 'viewer',
    category: 'coins',
    description: 'Карточка зрителя на оверлее. В чат ничего не пишет.',
  },
  spin: { aliases: ['roll', 'спин', 'лудка'], role: 'viewer', category: 'spin', description: 'Спин рулетки за монеты.' },
  spinstats: { aliases: [], role: 'viewer', category: 'spin', description: 'Сколько спинов, выиграно и проиграно.' },
  fish: { aliases: ['рыбачить', 'рыбалка'], role: 'viewer', category: 'fish', description: 'Заброс удочки.' },
  pivo: { aliases: ['пиво', 'beer'], role: 'viewer', category: 'pivo', description: 'Открыть пиво.' },
  buy: { aliases: ['купить'], role: 'viewer', category: 'hero', description: 'Купить героя: buy hero <имя>.' },
  use: {
    aliases: ['надеть', 'активировать'],
    role: 'viewer',
    category: 'hero',
    description: 'Сменить активного героя: use hero <имя>.',
  },
  tower: { aliases: ['башня'], role: 'viewer', category: 'tower', description: 'Отправить героя на следующий этаж башни. Три попытки в день.' },
  shop: { aliases: ['магазин', 'витрина'], role: 'viewer', category: 'hero', description: 'Витрина героев на оверлее.' },
  ticket: { aliases: ['билет'], role: 'viewer', category: 'lottery', description: 'Свой билет или прогресс до него.' },
  tickets: { aliases: ['розыгрыш'], role: 'viewer', category: 'lottery', description: 'У кого уже есть билеты.' },
  runlottery: {
    aliases: ['lottery', 'лотерея'],
    role: 'broadcaster',
    category: 'lottery',
    description: 'Запустить розыгрыш VIP.',
  },
  addvip: { aliases: ['vip'], role: 'moderator', category: 'vip', description: 'Выдать VIP: addvip <ник>.' },
  removevip: { aliases: ['rvip'], role: 'moderator', category: 'vip', description: 'Снять VIP: removevip <ник>.' },
  addfounder: {
    aliases: [],
    role: 'moderator',
    category: 'founder',
    description: 'Выдать статус основателя: addfounder <ник>.',
  },
  removefounder: {
    aliases: [],
    role: 'moderator',
    category: 'founder',
    description: 'Снять статус основателя: removefounder <ник>.',
  },
  xpboost: {
    aliases: [],
    role: 'moderator',
    category: 'boost',
    description: 'Включить буст XP: xpboost <минуты>; off выключает.',
  },
  timer: {
    aliases: ['counter', 'таймер'],
    role: 'moderator',
    category: 'timer',
    description: 'Запустить таймер: timer <минуты> <цвет> <название>.',
  },
  stoptimer: {
    aliases: ['timer-remove', 'timer-stop', 'таймер-стоп'],
    role: 'moderator',
    category: 'timer',
    description: 'Остановить таймер.',
  },
} as const satisfies Record<string, CodeCommandMeta>;

export type CodeCommandName = keyof typeof CODE_COMMANDS;

// Имя и алиасы для регистрации в боте
export const codeCommand = (name: CodeCommandName): { name: CodeCommandName; aliases: string[] } => ({
  name,
  aliases: [...CODE_COMMANDS[name].aliases],
});

// Группа и описание текстовых команд из шаблона (prisma/seed/commands.default.json). Прав у текстовых
// команд нет: их вызывает любой зритель. `personal` — текст у каждого канала свой, шаблон надо заменить
export const TEXT_COMMAND_INFO: Record<string, { category: CommandCategoryId; description: string; personal?: true }> = {
  gh: { category: 'about', description: 'Ссылка на GitHub.', personal: true },
  tg: { category: 'about', description: 'Ссылка на Telegram.', personal: true },
  project: { category: 'about', description: 'Над чем идёт работа на стриме.', personal: true },
  stack: { category: 'about', description: 'Инструменты и технологии.', personal: true },
  help: { category: 'chat', description: 'Список команд.' },
  version: { category: 'chat', description: 'Версия бота.' },
  lurk: { category: 'chat', description: 'Уйти в лурк. Из вариантов выбирается случайный.' },
  points: { category: 'coins', description: 'Как заработать и потратить монеты.' },
};

// Без COMMAND_PREFIX по умолчанию безопасный "!t"; только NODE_ENV=production даёт "!"
export const resolveCommandPrefix = (value: string | undefined, nodeEnv: string | undefined): string =>
  value || (nodeEnv === 'production' ? '!' : '!t');

// Ответ админке: одна текстовая команда со всеми языками
export type AdminTextCommand = {
  name: string;
  aliases: string[];
  cooldownMs: number;
  scope: 'global' | 'user';
  // Ответит ли бот на команду на своём языке
  enabled: boolean;
  // В базе по языкам разное состояние: переключатель его выровняет
  mixed: boolean;
  responses: Record<Lang, string[]>;
};

export type AdminCommands = { prefix: string; botLang: Lang; text: AdminTextCommand[] };

// Ограничение Twitch на одно сообщение чата
export const CHAT_MESSAGE_LIMIT = 500;
export const MAX_RESPONSES = 20;
// Самые длинные значения подстановок: ник Twitch и версия проекта
const LONGEST_VALUES: Record<string, number> = { user: 25, version: 12 };

// Длина ответа в чате с учётом подстановок {user}, {prefix}, {version}
export const responseLength = (template: string, prefix: string): number =>
  template.replace(/\{(user|prefix|version)\}/g, (_, key: string) => 'x'.repeat(LONGEST_VALUES[key] ?? prefix.length))
    .length;

// Перенос строки в чате невозможен; пустые варианты не сохраняются
export const cleanResponses = (responses: readonly string[]): string[] =>
  responses.map((text) => text.replace(/\s*[\r\n\t]+\s*/g, ' ').trim()).filter((text) => text !== '');

export type TextCommandUpdate = { enabled?: boolean; responses?: Record<Lang, string[]> };

type ParseResult = { ok: true; update: TextCommandUpdate } | { ok: false; error: string };

// Проверка правки: переключатель и/или ответы сразу на всех языках
export const parseTextCommandUpdate = (value: unknown, prefix: string): ParseResult => {
  const fail = (error: string): ParseResult => ({ ok: false, error });
  if (typeof value !== 'object' || value === null) return fail('Пустой запрос.');
  const { enabled, responses } = value as Record<string, unknown>;
  const update: TextCommandUpdate = {};

  if (enabled !== undefined) {
    if (typeof enabled !== 'boolean') return fail('Неверное значение переключателя.');
    update.enabled = enabled;
  }

  if (responses !== undefined) {
    if (typeof responses !== 'object' || responses === null) return fail('Неверный формат ответов.');
    const next = {} as Record<Lang, string[]>;
    for (const lang of LANGS) {
      const list: unknown = (responses as Record<string, unknown>)[lang];
      if (!Array.isArray(list) || !list.every((item) => typeof item === 'string')) {
        return fail(`${lang}: неверный формат ответов.`);
      }
      const cleaned = cleanResponses(list as string[]);
      if (cleaned.length === 0) return fail(`${lang}: нужен хотя бы один ответ.`);
      if (cleaned.length > MAX_RESPONSES) return fail(`${lang}: не больше ${MAX_RESPONSES} вариантов.`);
      const long = cleaned.findIndex((text) => responseLength(text, prefix) > CHAT_MESSAGE_LIMIT);
      if (long !== -1) return fail(`${lang}, вариант ${long + 1}: длиннее ${CHAT_MESSAGE_LIMIT} символов.`);
      next[lang] = cleaned;
    }
    update.responses = next;
  }

  if (update.enabled === undefined && !update.responses) return fail('Нечего сохранять.');
  return { ok: true, update };
};
