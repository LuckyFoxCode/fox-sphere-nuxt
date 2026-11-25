import type { Viewer } from '../../../generated/prisma/client';

export type CommandContext = {
  viewer: Viewer; // свежая строка из БД на момент сообщения
  displayName: string;
  args: string[];
  reply: (text: string) => Promise<void>;
  // Вернуть зрителю кулдаун: команда не состоялась (например, не хватило монет)
  releaseCooldown: () => void;
};

export type Command = {
  name: string;
  aliases?: string[];
  cooldownMs: number;
  // Ответ на повтор во время кулдауна — один раз за кулдаун. Без него повтор молча пропускается
  cooldownMessage?: (displayName: string, secondsLeft: number) => string;
  run: (ctx: CommandContext) => Promise<void>;
};
