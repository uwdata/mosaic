export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';
export class Logger {
  constructor(private level: LogLevel) {}

  debug(...args: unknown[]) {
    if (this.level === 'debug') {
      console.log(...args);
    }
  }
  info(...args: unknown[]) {
    if (this.level === 'debug' || this.level === 'info') {
      console.log(...args);
    }
  }
  warn(...args: unknown[]) {
    if (['debug','info','warn'].includes(this.level)) {
      console.warn(...args);
    }
  }
  error(...args: unknown[]) {
    if (this.level !== 'silent') {
      console.error(...args);
    }
  }
}