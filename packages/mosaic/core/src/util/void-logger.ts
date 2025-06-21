interface Logger {
  debug(...args: any[]): void;
  info(...args: any[]): void;
  log(...args: any[]): void;
  warn(...args: any[]): void;
  error(...args: any[]): void;
  group(label?: string): void;
  groupCollapsed(label?: string): void;
  groupEnd(): void;
}

export function voidLogger(): Logger {
  return {
    debug(..._: any[]): void {},
    info(..._: any[]): void {},
    log(..._: any[]): void {},
    warn(..._: any[]): void {},
    error(..._: any[]): void {},
    group(label?: string): void {},
    groupCollapsed(label?: string): void {},
    groupEnd(): void {}
  };
}