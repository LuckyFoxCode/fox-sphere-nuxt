// Все фразы, которые бот пишет в чат, и надписи алерта сундука. Новая фраза сначала появляется
// здесь, и TypeScript не даст забыть её ни в одном языке.

type NameMessage = (name: string) => string;
type CoinsMessage = (name: string, coins: number) => string;
// Столько вариантов у «сорвалась» и у улова монет, во всех языках поровну
type Three<T> = [T, T, T];
type Five<T> = [T, T, T, T, T];

export type ProfileStats = {
  lvl: number;
  // XP внутри текущего уровня и сколько его нужно до следующего
  xp: number;
  xpToNext: number;
  coins: number;
  rank: number;
};

export type FishMessages = {
  cast: NameMessage;
  already: NameMessage;
  cooldown: (name: string, secondsLeft: number) => string;
  empty: Three<NameMessage>;
  coins: Three<CoinsMessage>;
  xp: (name: string, xp: number) => string;
  // Сундук не платит игроку: текст не должен читаться как личная выплата
  bank: (name: string, coins: number) => string;
};

export type HeroMessages = {
  buyUsage: (name: string, prefix: string) => string;
  useUsage: (name: string, prefix: string) => string;
  // Список названий через запятую
  unknown: (name: string, heroes: string) => string;
  alreadyOwned: (name: string, hero: string) => string;
  notEnough: (name: string, hero: string, price: number, have: number, shortfall: number) => string;
  bought: (name: string, hero: string, price: number, coinsAfter: number, prefix: string) => string;
  notOwned: (name: string, hero: string, prefix: string) => string;
  alreadyActive: (name: string, hero: string) => string;
  equipped: (name: string, hero: string) => string;
  // Витрина в чат: каждый герой с ценой (0 — бесплатный)
  shop: (name: string, items: { name: string; price: number }[], prefix: string) => string;
};

export type PivoMessages = {
  regular: Five<NameMessage>;
  golden: NameMessage;
};

// Команды выдачи и снятия VIP (!addvip, !removevip). `mod` — кто выдал, `name` — кому
export type VipMessages = {
  added: (mod: string, name: string) => string;
  removed: (mod: string, name: string) => string;
  // Подсказка при команде без ника: `prefix` — префикс команд, `command` — addvip или removevip
  usage: (name: string, prefix: string, command: string) => string;
  notFound: (name: string) => string;
  denied: (name: string) => string;
  // Twitch отказал или у бота нет токена стримера: подробности только в логе бота
  failed: (name: string) => string;
};

// Буст XP (!xpboost). `minutes` — на сколько включён, `multiplier` — во сколько раз больше XP
export type XpBoostMessages = {
  started: (name: string, minutes: number, multiplier: number) => string;
  // Подсказка при неверной длительности: допустимый диапазон в минутах
  usage: (name: string, prefix: string, min: number, max: number) => string;
  cancelled: NameMessage;
  noActive: NameMessage;
};

// Таймер на оверлее (!timer, !stoptimer). `title` печатается как набрал стример
export type TimerMessages = {
  started: (name: string, minutes: number, title: string) => string;
  usage: (name: string, prefix: string) => string;
  stopped: NameMessage;
};

// Надписи алерта «сундук» на оверлее; ник на нём печатается отдельной строкой
export type ChestAlertMessages = {
  label: string;
  toBank: (coins: number) => string;
};

// Лотерея VIP: чат (`!ticket`, `!tickets`, `!runlottery`) и надписи сцены на оверлее
export type LotteryMessages = {
  ticketEarned: NameMessage;
  ticketHave: NameMessage;
  ticketProgress: (name: string, xp: number, threshold: number) => string;
  alreadyRunning: NameMessage;
  // Анонс в начале розыгрыша и в конце: уходят анонсами Twitch
  start: string;
  final: string;
  vipFailed: NameMessage;
  postponed: string;
  noTicketsYet: string;
  totalTickets: (count: number) => string;
  ticketList: (names: string, count: number, threshold: number) => string;
};

// Надписи сцены лотереи и алерта билета на оверлее; ники печатаются как есть
export type LotterySceneMessages = {
  label: string;
  title: string;
  intro: string;
  drawing: string;
  finale: string;
  entries: string;
  newVip: string;
  extended: string;
  until: string;
  listLabel: string;
  listTitle: (count: number) => string;
  more: (count: number) => string;
  ticketLabel: string;
  ticketDetail: string;
};

export type SpinMessages = {
  cooldown: (name: string, secondsLeft: number, prefix: string) => string;
  notEnough: (name: string, price: number, have: number) => string;
  coins: CoinsMessage;
  xp: (name: string, xp: number) => string;
  jackpotAnnounce: NameMessage;
  jackpotResult: (name: string, coins: number, bank: number) => string;
  statsNone: (name: string, prefix: string) => string;
  stats: (name: string, spins: number, win: number, loss: number) => string;
};

export type BotMessages = {
  levelUp: (name: string, lvl: number) => string;
  streamLevelUp: (lvl: number) => string;
  follow: NameMessage;
  raid: (name: string, viewers: number) => string;
  coins: CoinsMessage;
  profile: (name: string, stats: ProfileStats) => string;
  spin: SpinMessages;
  fish: FishMessages;
  hero: HeroMessages;
  pivo: PivoMessages;
  vip: VipMessages;
  // Отказ командам для стримера и модераторов (!xpboost, !timer, !stoptimer)
  denied: NameMessage;
  xpBoost: XpBoostMessages;
  timer: TimerMessages;
  chestAlert: ChestAlertMessages;
  lottery: LotteryMessages;
  lotteryScene: LotterySceneMessages;
};
