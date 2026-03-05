interface Logger {
  debug(...args: unknown[]): void;
  info(...args: unknown[]): void;
  log(...args: unknown[]): void;
  warn(...args: unknown[]): void;
  error(...args: unknown[]): void;
  group(label?: string): void;
  groupCollapsed(label?: string): void;
  groupEnd(): void;
}

export function voidLogger(): Logger {
  return {
    debug(): void {},
    info(): void {},
    log(): void {},
    warn(): void {},
    error(): void {},
    group(): void {},
    groupCollapsed(): void {},
    groupEnd(): void {}
  };
}