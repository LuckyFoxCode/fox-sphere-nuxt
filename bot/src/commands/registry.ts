import type { Command, CommandContext } from './types';

// Один канал: ключ кулдауна — только команда + twitchId зрителя.
export class CommandRegistry {
  private byName = new Map<string, Command>();
  private lastUsed = new Map<string, number>();

  constructor(private prefix: string) {}

  register(command: Command) {
    for (const name of [command.name, ...(command.aliases ?? [])]) {
      this.byName.set(name.toLowerCase(), command);
    }
  }

  // true, если сообщение было командой (даже если сработал кулдаун)
  async dispatch(text: string, build: (args: string[]) => CommandContext): Promise<boolean> {
    if (!text.startsWith(this.prefix)) return false;
    const [rawName, ...args] = text.slice(this.prefix.length).trim().split(/\s+/);
    const command = this.byName.get((rawName ?? '').toLowerCase());
    if (!command) return false;

    const ctx = build(args);
    const key = `${command.name}:${ctx.viewer.twitchId}`;
    const now = Date.now();
    if (now - (this.lastUsed.get(key) ?? 0) < command.cooldownMs) return true;
    this.lastUsed.set(key, now);

    try {
      await command.run(ctx);
    } catch (error) {
      console.error(`[bot] команда ${command.name} упала:`, error);
    }
    return true;
  }
}
