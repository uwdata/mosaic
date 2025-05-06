/* eslint-disable no-unused-vars */
export function voidLogger() {
  return {
    debug(..._) {},
    info(..._) {},
    log(..._) {},
    warn(..._) {},
    error(..._) {},
    group(label) {},
    groupCollapsed(label) {},
    groupEnd() {}
  };
}
