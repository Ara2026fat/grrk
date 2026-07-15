export type LogLevel = "error" | "warning";

export interface LogEntry {
  id: string;
  level: LogLevel;
  message: string;
  timestamp: string;
}

class LoggingService {
  private entries: LogEntry[] = [];

  log(level: LogLevel, message: string): void {
    this.entries.unshift({ id: crypto.randomUUID(), level, message, timestamp: new Date().toISOString() });
    if (this.entries.length > 200) this.entries.length = 200;
  }

  getRecent(level: LogLevel, limit = 20): LogEntry[] {
    return this.entries.filter((e) => e.level === level).slice(0, limit);
  }
}

export const loggingService = new LoggingService();
