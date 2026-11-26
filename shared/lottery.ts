// Лотерея VIP, перенесена из старого fox-sphere (modules/lottery): правила и тайминги сцены.
// Правила: за сообщения копится недельный XP, на 100 XP выдаётся билет, раз в неделю стример запускает
// `!runlottery`: из держателей билетов выбираются 5 победителей, им на неделю ставится временный VIP
// (`Viewer.isLuckyVip`), у прошлых победителей он снимается, недельный XP и билеты обнуляются у всех.
// Постоянные VIP (`isPermanentVip`) в розыгрыше не участвуют и лотереей не снимаются.

export const LOTTERY_CONFIG = {
  TICKET_XP_THRESHOLD: 100,
  WINNERS_COUNT: 5,
  // В недельный счёт идёт 1 XP за сообщение: без надбавок за роли и без буста, как в старом боте
  XP_PER_MESSAGE: 1,
  // Не чаще раза в 5 с на зрителя (отдельно от кулдауна обычного XP, 15 с)
  XP_COOLDOWN_MS: 5000,
} as const;

// От скольких билетов `!tickets` показывает список на оверлее, а в чат пишет только число
export const LOTTERY_LIST_MIN = 10;

// --- Сцена розыгрыша -------------------------------------------------------------------------
// Длительность сцены ФИКСИРОВАНА и от числа участников не зависит (в старой лотерее от него зависел
// тайминг, и анимация расходилась с чатом). Участников меняет только плотность потока имён на оверлее.
export const LOTTERY_INTRO_MS = 2600;
export const LOTTERY_DRAW_MS = 7000;
export const LOTTERY_FINALE_MS = 5400;
export const LOTTERY_SCENE_MS = LOTTERY_INTRO_MS + LOTTERY_DRAW_MS + LOTTERY_FINALE_MS;
// Когда последний барабан встал: с этого момента бот пишет победителей в чат
export const LOTTERY_REVEAL_AT_MS = LOTTERY_INTRO_MS + LOTTERY_DRAW_MS;
// Пауза между сценами: следующая начинается на пустом экране
export const LOTTERY_GAP_MS = 400;
// Список билетов (`!tickets`, от 10 билетов)
export const LOTTERY_PARTICIPANTS_SHOW_MS = 7000;
export const LOTTERY_PARTICIPANTS_MAX_NAMES = 60;

// Сколько имён уходит на оверлей: на ленту хватает выборки, остальное оверлей знает только числом
export const LOTTERY_ENTRIES_MAX = 150;

// Первый барабан встаёт через столько после начала розыгрыша, дальше равными шагами до LOTTERY_DRAW_MS
const FIRST_LOCK_MS = 2800;

// Через сколько после старта розыгрыша встаёт барабан места `place` из `count` (от начала фазы
// розыгрыша). Места встают с последнего к первому, одно место стоит до самого конца.
export const lotteryReelMs = (place: number, count: number): number => {
  if (count <= 1) return LOTTERY_DRAW_MS;
  const step = (LOTTERY_DRAW_MS - FIRST_LOCK_MS) / (count - 1);
  return Math.round(FIRST_LOCK_MS + (count - place) * step);
};
