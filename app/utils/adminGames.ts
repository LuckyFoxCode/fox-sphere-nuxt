// Карточки страницы админки «Игры» (кроме башни, у неё свой компонент). Все числа берутся из shared/,
// поэтому после правки цен, шансов или наград здесь ничего менять не надо. Новая игра — новая запись.
import { ACHIEVEMENT_CATEGORIES, PROFILE_BADGE_SLOTS } from '#shared/achievements';
import { COMMAND_CATEGORIES, type CodeCommandName, type CommandCategoryId } from '#shared/commands';
import {
  BOOST_CONFIG,
  COIN_EXCHANGE_PACKAGES,
  COOLDOWNS,
  WATCH_STREAK_REWARD,
  XP_REWARDS,
} from '#shared/economy';
import {
  FISH_BITE_DELAY_MAX_MS,
  FISH_BITE_DELAY_MIN_MS,
  FISH_CATCH_IDS,
  FISH_CATCH_WEIGHTS,
  FISH_CATCHES,
  FISH_COOLDOWN_MS,
  FISH_TOTAL_WEIGHT,
  type FishCatch,
} from '#shared/fishing';
import { LOTTERY_CONFIG, LOTTERY_LIST_MIN } from '#shared/lottery';
import { PIVO_COOLDOWN_MS, PIVO_OUTCOME_WEIGHTS, PIVO_TIER_LABELS, PIVO_TIER_THRESHOLDS } from '#shared/pivo';
import {
  JACKPOT_SEED,
  JACKPOT_SHARE,
  ROULETTE_PRICE,
  ROULETTE_PRIZE_WEIGHTS,
  ROULETTE_PRIZES,
  ROULETTE_SEGMENT_IDS,
  ROULETTE_TOTAL_WEIGHT,
  SPIN_COOLDOWN_MS,
  type RoulettePrize,
} from '#shared/roulette';
import { FRUIT_PRICE_PER_LEVEL, fruitPrice, heroXpToNext } from '#shared/tower';

export type AdminGameLink = { label: string; to: string; icon: string };

export type AdminGame = {
  id: 'heroes' | 'roulette' | 'fish' | 'lottery' | 'boost' | 'pivo' | 'economy' | 'achievements';
  title: string;
  icon: string;
  summary: string;
  commands: CodeCommandName[];
  links: AdminGameLink[];
  rules: string[];
  table?: { title: string; head: [string, string]; rows: [string, string][] };
};

// Кнопка «Команды»: открывает раздел «Команды» с поиском по названию группы
export const commandsLink = (category: CommandCategoryId): AdminGameLink => ({
  label: 'Команды',
  to: `/admin/commands?q=${encodeURIComponent(COMMAND_CATEGORIES.find((item) => item.id === category)!.title)}`,
  icon: 'i-lucide-terminal',
});

const consoleLink = (label: string): AdminGameLink => ({ label, to: '/admin', icon: 'i-lucide-radio' });
const viewersLink: AdminGameLink = { label: 'Зрители', to: '/admin/viewers', icon: 'i-lucide-users' };

const seconds = (ms: number): number => ms / 1000;
const percent = (weight: number, total: number): string =>
  `${((weight / total) * 100).toLocaleString('ru', { maximumFractionDigits: 1 })}%`;

const prizeName = (prize: RoulettePrize): string => {
  switch (prize.prizeType) {
    case 'coins':
      return `${prize.coinAmount} монет`;
    case 'xp':
      return `${prize.xpAmount} XP`;
    case 'jackpot':
      return 'Джекпот: весь банк';
    case 'empty':
      return 'Ничего';
  }
};

const catchName = (caught: FishCatch): string => {
  switch (caught.catchType) {
    case 'coins':
      return `${caught.coinAmount} монет`;
    case 'xp':
      return `${caught.xpAmount} XP`;
    case 'bank':
      return `Сундук: ${caught.bankAmount} монет в банк рулетки`;
    case 'empty':
      return 'Рыба сорвалась';
  }
};

export const adminGames = (commandPrefix: string): AdminGame[] => {
  const prefix = commandPrefix || '!';
  const goldWeight = PIVO_OUTCOME_WEIGHTS.golden;

  return [
    {
      id: 'heroes',
      title: 'Герои и прокачка',
      icon: 'i-lucide-swords',
      summary: 'Зрители покупают героев за монеты. Герой ходит по низу экрана и растёт в башне.',
      commands: ['buy', 'use', 'shop'],
      links: [commandsLink('hero'), viewersLink],
      rules: [
        'Новый зритель сразу получает бесплатного героя.',
        `${prefix}buy hero <имя> покупает героя, ${prefix}use hero <имя> делает его активным, ${prefix}shop показывает витрину на оверлее.`,
        `${prefix}buy fruit — фрукт роста: активный герой получает +1 уровень за ${FRUIT_PRICE_PER_LEVEL} монет, умноженные на его текущий уровень (1→2 стоит ${fruitPrice(1)}, 2→3 стоит ${fruitPrice(2)}). Опыт внутри уровня остаётся. Это главный способ тратить монеты на героя.`,
        'Опыт герою дают только бои в башне: победа больше, поражение меньше. Сообщения в чате уровень героя не повышают.',
        `До следующего уровня нужно ${heroXpToNext(1)} опыта, умноженные на текущий уровень.`,
        'С уровнем растут здоровье, атака и защита. Скорость не меняется. У каждого героя свой уровень.',
      ],
    },
    {
      id: 'roulette',
      title: 'Рулетка',
      icon: 'i-lucide-dices',
      summary: 'Спин за монеты с призами и общим банком. Главный способ тратить монеты.',
      commands: ['spin', 'spinstats'],
      links: [commandsLink('spin')],
      rules: [
        `Спин стоит ${ROULETTE_PRICE} монет, повторить можно через ${seconds(SPIN_COOLDOWN_MS)} с.`,
        `С каждого спина ${JACKPOT_SHARE} монет уходит в банк. Он виден в шапке стрима.`,
        `Джекпот забирает весь банк, после этого банк начинается с ${JACKPOT_SEED}.`,
      ],
      table: {
        title: 'Призы и шансы',
        head: ['Приз', 'Шанс'],
        rows: ROULETTE_SEGMENT_IDS.map((id) => [
          prizeName(ROULETTE_PRIZES[id]),
          percent(ROULETTE_PRIZE_WEIGHTS[id], ROULETTE_TOTAL_WEIGHT),
        ]),
      },
    },
    {
      id: 'fish',
      title: 'Рыбалка',
      icon: 'i-lucide-fish',
      summary: 'Бесплатная игра: зритель забрасывает удочку и через время получает улов.',
      commands: ['fish'],
      links: [commandsLink('fish')],
      rules: [
        `Забросить можно раз в ${seconds(FISH_COOLDOWN_MS)} с.`,
        `Клюёт само, через ${seconds(FISH_BITE_DELAY_MIN_MS)}–${seconds(FISH_BITE_DELAY_MAX_MS)} с после заброса.`,
        'Сундук ничего не даёт зрителю, но пополняет банк рулетки и показывается на оверлее.',
      ],
      table: {
        title: 'Улов и шансы',
        head: ['Улов', 'Шанс'],
        rows: FISH_CATCH_IDS.map((id) => [
          catchName(FISH_CATCHES[id]),
          percent(FISH_CATCH_WEIGHTS[id], FISH_TOTAL_WEIGHT),
        ]),
      },
    },
    {
      id: 'lottery',
      title: 'VIP-лотерея',
      icon: 'i-lucide-ticket',
      summary: 'Активные зрители получают билет, а стример раз в неделю разыгрывает временный VIP.',
      commands: ['ticket', 'tickets', 'runlottery'],
      links: [consoleLink('Розыгрыш на пульте'), commandsLink('lottery')],
      rules: [
        `За сообщения копится недельный XP: ${LOTTERY_CONFIG.XP_PER_MESSAGE} не чаще раза в ${seconds(LOTTERY_CONFIG.XP_COOLDOWN_MS)} с.`,
        `На ${LOTTERY_CONFIG.TICKET_XP_THRESHOLD} XP выдаётся билет. Постоянные VIP в розыгрыше не участвуют.`,
        `Розыгрыш запускает стример: ${prefix}runlottery или кнопка на пульте эфира.`,
        `Победителей до ${LOTTERY_CONFIG.WINNERS_COUNT}, VIP держится до следующего розыгрыша.`,
        'После розыгрыша билеты и недельный XP обнуляются у всех.',
        `${prefix}tickets показывает держателей билетов: от ${LOTTERY_LIST_MIN} человек списком на оверлее.`,
      ],
    },
    {
      id: 'boost',
      title: 'Буст XP',
      icon: 'i-lucide-zap',
      summary: `На время умножает на ${BOOST_CONFIG.MULTIPLIER} опыт за сообщения, и зрителям, и стриму.`,
      commands: ['xpboost'],
      links: [consoleLink('Включить на пульте'), commandsLink('boost')],
      rules: [
        `${prefix}xpboost <минуты> включает буст на ${BOOST_CONFIG.MIN_MINUTES}–${BOOST_CONFIG.MAX_MINUTES} минут (без числа ${BOOST_CONFIG.DEFAULT_MINUTES}), ${prefix}xpboost off выключает.`,
        'Включать могут стример и модераторы.',
        `Когда стрим получает новый уровень, буст сам включается на ${BOOST_CONFIG.AUTO_MINUTES} минут, если другой не идёт.`,
        'На опыт из рулетки, рыбалки и стриков буст не действует.',
      ],
    },
    {
      id: 'pivo',
      title: 'Пиво',
      icon: 'i-lucide-beer',
      summary: 'Шуточная команда: изредка выпадает золотое пиво, которое копится в профиле.',
      commands: ['pivo'],
      links: [commandsLink('pivo')],
      rules: [
        `Открыть пиво можно раз в ${seconds(PIVO_COOLDOWN_MS)} с.`,
        `Шанс золотого пива ${percent(goldWeight, PIVO_OUTCOME_WEIGHTS.regular + goldWeight)}. Оно показывается алертом на оверлее.`,
        'Монеты и опыт за пиво не даются.',
      ],
      table: {
        title: 'Ступени золотого пива',
        head: ['Ступень', 'Сколько золотых нужно'],
        rows: PIVO_TIER_THRESHOLDS.map((threshold, index) => [PIVO_TIER_LABELS[index]!, String(threshold)]),
      },
    },
    {
      id: 'economy',
      title: 'Монеты и опыт',
      icon: 'i-lucide-coins',
      summary: 'Откуда у зрителей берутся монеты и уровни.',
      commands: ['coins', 'profile'],
      links: [commandsLink('coins'), viewersLink],
      rules: [
        `Опыт за сообщение не чаще раза в ${seconds(COOLDOWNS.XP_MESSAGE_COOLDOWN)} с: зритель ${XP_REWARDS.DEFAULT}, фолловер ${XP_REWARDS.FOLLOWER}, саб ${XP_REWARDS.SUBSCRIBER}, стример ${XP_REWARDS.BROADCASTER}.`,
        `VIP получает ещё +${XP_REWARDS.VIP_BONUS}, founder +${XP_REWARDS.FOUNDER_BONUS}.`,
        'За сообщения монеты не даются. Их приносят рулетка, рыбалка, башня, стрики и обмен баллов канала.',
        `Стрик просмотров: награда на 3, 5, 7, а с 10 на каждом пятом. Это стрик × ${WATCH_STREAK_REWARD.XP_PER_STREAK} XP и стрик × ${WATCH_STREAK_REWARD.COINS_PER_STREAK} монет, повторно вдвое меньше.`,
      ],
      table: {
        title: 'Обмен баллов канала на монеты',
        head: ['Награда Twitch', 'Баллы → монеты'],
        rows: Object.values(COIN_EXCHANGE_PACKAGES).map((pack) => [pack.title, `${pack.points} → ${pack.coins}`]),
      },
    },
    {
      id: 'achievements',
      title: 'Ачивки',
      icon: 'i-lucide-award',
      summary: 'Значки за игры и стрики. Выдаются сами, ими хвастаются в карточке профиля.',
      commands: ['profile'],
      links: [viewersLink],
      rules: [
        'Ступень считается из статистики зрителя, вручную ничего выдавать не нужно.',
        `В карточке профиля видны ${PROFILE_BADGE_SLOTS} самых редких значка.`,
        'Все ачивки зрителя с прогрессом есть на его странице в разделе «Зрители».',
      ],
      table: {
        title: 'Какие есть ачивки',
        head: ['Ачивка', 'Пороги ступеней'],
        rows: ACHIEVEMENT_CATEGORIES.map((category) => [
          category.title,
          category.requirements
            ? category.requirements.map((tier) => `${tier.heroes} гер. до этажа ${tier.floor}`).join('; ')
            : `${category.thresholds.join(', ')} (${category.unit})`,
        ]),
      },
    },
  ];
};
