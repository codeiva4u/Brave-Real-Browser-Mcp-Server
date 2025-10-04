/**
 * Professional Logger System for MCP Server
 * Environment-based log levels with structured logging
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  SILENT = 4
}

export interface LoggerOptions {
  level?: string;
  enableDebug?: boolean;
  enableTimestamp?: boolean;
  enableColors?: boolean;
}

export class Logger {
  private level: LogLevel;
  private enableDebug: boolean;
  private enableTimestamp: boolean;
  private enableColors: boolean;

  constructor(options: LoggerOptions = {}) {
    this.level = this.parseLevel(options.level || process.env.LOG_LEVEL || 'info');
    this.enableDebug = options.enableDebug ?? (process.env.DEBUG === 'true');
    this.enableTimestamp = options.enableTimestamp ?? true;
    this.enableColors = options.enableColors ?? true;
  }

  private parseLevel(level: string): LogLevel {
    switch (level.toLowerCase()) {
      case 'debug': return LogLevel.DEBUG;
      case 'info': return LogLevel.INFO;
      case 'warn': return LogLevel.WARN;
      case 'error': return LogLevel.ERROR;
      case 'silent': return LogLevel.SILENT;
      default: return LogLevel.INFO;
    }
  }

  private getTimestamp(): string {
    return new Date().toISOString();
  }

  private formatMessage(level: string, message: string, ...args: any[]): string {
    const parts: string[] = [];
    
    if (this.enableTimestamp) {
      parts.push(`[${this.getTimestamp()}]`);
    }
    
    parts.push(`[${level}]`);
    parts.push(message);
    
    if (args.length > 0) {
      const formatted = args.map(arg => {
        if (typeof arg === 'object') {
          try {
            return JSON.stringify(arg, null, 2);
          } catch {
            return String(arg);
          }
        }
        return String(arg);
      }).join(' ');
      parts.push(formatted);
    }
    
    return parts.join(' ');
  }

  debug(message: string, ...args: any[]): void {
    if (this.enableDebug && this.level <= LogLevel.DEBUG) {
      const formatted = this.formatMessage('DEBUG', message, ...args);
      console.error(`🔍 ${formatted}`);
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.INFO) {
      const formatted = this.formatMessage('INFO', message, ...args);
      console.error(`ℹ️  ${formatted}`);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.WARN) {
      const formatted = this.formatMessage('WARN', message, ...args);
      console.error(`⚠️  ${formatted}`);
    }
  }

  error(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.ERROR) {
      const formatted = this.formatMessage('ERROR', message, ...args);
      console.error(`❌ ${formatted}`);
    }
  }

  // Check if debug is enabled
  isDebugEnabled(): boolean {
    return this.enableDebug && this.level <= LogLevel.DEBUG;
  }

  // Create child logger with same configuration
  child(options: Partial<LoggerOptions> = {}): Logger {
    return new Logger({
      level: options.level || this.getLevelString(),
      enableDebug: options.enableDebug ?? this.enableDebug,
      enableTimestamp: options.enableTimestamp ?? this.enableTimestamp,
      enableColors: options.enableColors ?? this.enableColors
    });
  }

  private getLevelString(): string {
    switch (this.level) {
      case LogLevel.DEBUG: return 'debug';
      case LogLevel.INFO: return 'info';
      case LogLevel.WARN: return 'warn';
      case LogLevel.ERROR: return 'error';
      case LogLevel.SILENT: return 'silent';
      default: return 'info';
    }
  }
}

// Global logger instance
export const logger = new Logger({
  level: process.env.LOG_LEVEL || 'info',
  enableDebug: process.env.DEBUG === 'true'
});

// Convenience function to create new logger
export function createLogger(options: LoggerOptions = {}): Logger {
  return new Logger(options);
}
