/**
 * Centralized logging (Blueprint Standard 17.11: "the only genuinely new
 * architectural primitive introduced by the Health Center standard").
 * Services write here on error/warning; the System Health Center reads it.
 */
export type LogLevel = "error" | "warning" | "info";

export interface LogEntry {
  id: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  timestamp: string;
}

export interface ILoggingService {
  log(level: LogLevel, message: string, context?: Record<string, unknown>): void;
  getRecent(level?: LogLevel, limit?: number): LogEntry[];
}
