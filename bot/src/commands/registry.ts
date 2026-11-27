import type { CodeCommandName } from '../../../shared/commands';
import type { Command, CommandContext } from './types';

// Один канал: ключ кулдауна — только команда + twitchId зрителя.
export class CommandRegistry {
  private byName = new Map<string, Command>();
  private cooldowns = new Map<string, { since: number; notified: boolean }>();

  // Команды не из кода (текстовые из БД): код всегда главнее, поэтому ищем их только после byName
  private fallback?: (name: string) => Promise<Command | undefined>;

  constructor(private prefix: string) {}

  setFallback(lookup: (name: string) => Promise<Command | undefined>) {
    this.fallback = lookup;
  }

  // Команда из кода должна быть в каталоге shared/commands.ts: по нему её показывает админка
  register(command: Command & { name: CodeCommandName }) {
    for (const name of [command.name, ...(command.aliases ?? [])]) {
      this.byName.set(name.toLowerCase(), command);
    }
  }

  // true, если сообщение было командой (даже если сработал кулдаун)
  async dispatch(
    text: string,
    build: (args: string[]) => Omit<CommandContext, 'releaseCooldown'>,
  ): Promise<boolean> {
    if (!text.startsWith(this.prefix)) return false;
    const [rawName, ...args] = text.slice(this.prefix.length).trim().split(/\s+/);
    const name = (rawName ?? '').toLowerCase();
    const command = this.byName.get(name) ?? (await this.fallback?.(name));
    if (!command) return false;

    const base = build(args);
    const key = command.cooldownScope === 'global' ? command.name : `${command.name}:${base.viewer.twitchId}`;
    const now = Date.now();
    const active = this.cooldowns.get(key);
    if (active && now - active.since < command.cooldownMs) {
      if (command.cooldownMessage && !active.notified) {
        active.notified = true;
        const secondsLeft = Math.ceil((active.since + command.cooldownMs - now) / 1000);
        await base
          .reply(command.cooldownMessage(base.displayName, secondsLeft))
          .catch((error: unknown) => console.error(`[bot] ответ о кулдауне ${command.name} не отправлен:`, error));
      }
      return true;
    }

    // Кулдаун ставится до запуска, чтобы спам не прошёл, пока команда выполняется
    const reserved = { since: now, notified: false };
    this.cooldowns.set(key, reserved);
    // Снимается только свой резерв: более поздний запуск той же команды не трогаем
    const releaseCooldown = () => {
      if (this.cooldowns.get(key) === reserved) this.cooldowns.delete(key);
    };

    try {
      await command.run({ ...base, releaseCooldown });
    } catch (error) {
      // Как в старом боте: неудачная попытка кулдаун не тратит
      releaseCooldown();
      console.error(`[bot] команда ${command.name} упала:`, error);
    }
    return true;
  }
}
