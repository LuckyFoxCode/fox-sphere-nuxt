import type { Viewer } from '../../../generated/prisma/client';

export type CommandContext = {
  viewer: Viewer; // свежая строка из БД на момент сообщения
  displayName: string;
  args: string[];
  reply: (text: string) => Promise<void>;
};

export type Command = {
  name: string;
  aliases?: string[];
  cooldownMs: number;
  run: (ctx: CommandContext) => Promise<void>;
};
