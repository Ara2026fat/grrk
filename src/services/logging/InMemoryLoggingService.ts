import type { ILoggingService, LogEntry, LogLevel } from "./ILoggingService";

/**
 * Stage 0 implementation: an in-memory ring buffer. This is sufficient for
 * the System Health Center foundation; a persisted (IndexedDB-backed) log
 * table can replace this without changing the ILoggingService contract or
 * any caller.
 */
class InMemoryLoggingService implements ILoggingService {
  private entries: LogEntry[] = [];
  private readonly maxEntries = 500;

  log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
    this.entries.unshift({
      id: crypto.randomUUID(),
      level,
      message,
      context,
      timestamp: new Date().toISOString(),
    });
    if (this.entries.length > this.maxEntries) this.entries.length = this.maxEntries;
    if (level === "error") console.error(message, context);
    else if (level === "warning") console.warn(message, context);
  }

  getRecent(level?: LogLevel, limit = 50): LogEntry[] {
    const filtered = level ? this.entries.filter((e) => e.level === level) : this.entries;
    return filtered.slice(0, limit);
  }
}

export const loggingService: ILoggingService = new InMemoryLoggingService();
