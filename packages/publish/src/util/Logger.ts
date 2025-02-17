import chalk from 'chalk';
import { format } from 'util';

export enum LogLevel {
  INFO = 0,
  WARN = 1,
  ERROR = 2,
  SILENT = 3
}

export const toLogLevel = (level: string): LogLevel => {
  switch (level.toUpperCase()) {
    case 'INFO': return LogLevel.INFO;
    case 'WARN': return LogLevel.WARN;
    case 'ERROR': return LogLevel.ERROR;
    case 'SILENT': return LogLevel.SILENT;
    default: throw new Error(`Invalid log level: ${level}`);
  }
}

export class Logger {
  constructor(private level: LogLevel) { }

  private log(logFunction: (message: string) => void, prefix: string, ...args: any[]) {
    const str = args.map(arg => format('%s', arg)).join(' ');
    logFunction(str.split('\n').map(line => prefix + line).join('\n'));
  }

  info(...args: unknown[]) {
    if (this.level <= LogLevel.INFO) {
      this.log(console.log, chalk.blueBright('[INFO] '), ...args);
    }
  }

  warn(...args: any[]) {
    if (this.level <= LogLevel.WARN) {
      this.log(console.warn, chalk.yellowBright('[WARN] '), ...args);
    }
  }

  error(...args: any[]) {
    if (this.level <= LogLevel.ERROR) {
      this.log(console.error, chalk.redBright('[ERROR] '), ...args);
    }
  }
}