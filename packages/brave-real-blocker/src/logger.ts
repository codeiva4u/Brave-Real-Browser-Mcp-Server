/**
 * Simple Logger for brave-real-blocker
 */

export type LogLevel = 'silent' | 'error' | 'warn' | 'info' | 'verbose';

export class Logger {
    private level: LogLevel = 'info';

    private readonly levels: Record<LogLevel, number> = {
        silent: 0,
        error: 1,
        warn: 2,
        info: 3,
        verbose: 4
    };

    constructor(level: LogLevel = 'info') {
        this.level = level;
        if (process.env.DEBUG) {
            this.level = 'verbose';
        } else if (process.env.CI) {
            this.level = 'info';
        }
    }

    setLevel(level: LogLevel): void {
        this.level = level;
    }

    private shouldLog(level: LogLevel): boolean {
        return this.levels[level] <= this.levels[this.level];
    }

    private timestamp(): string {
        return new Date().toISOString();
    }

    log(prefix: string, message: string, ...args: any[]): void {
        this.info(prefix, message, ...args);
    }

    info(prefix: string, message: string, ...args: any[]): void {
        if (this.shouldLog('info')) {
            console.log(`[${this.timestamp()}] INFO    [${prefix}] ${message}`, ...args);
        }
    }

    warn(prefix: string, message: string, ...args: any[]): void {
        if (this.shouldLog('warn')) {
            console.warn(`[${this.timestamp()}] WARN    [${prefix}] ${message}`, ...args);
        }
    }

    error(prefix: string, message: string, ...args: any[]): void {
        if (this.shouldLog('error')) {
            console.error(`[${this.timestamp()}] ERROR   [${prefix}] ${message}`, ...args);
        }
    }

    verbose(prefix: string, message: string, ...args: any[]): void {
        if (this.shouldLog('verbose')) {
            console.debug(`[${this.timestamp()}] VERBOSE [${prefix}] ${message}`, ...args);
        }
    }
}

export const log = new Logger();
