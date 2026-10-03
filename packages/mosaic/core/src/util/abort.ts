/**
 * Settle with a promise, or reject with an abort signal's reason if the
 * signal aborts first.
 * @param promise The promise to wrap.
 * @param signal The abort signal.
 * @returns A promise that settles with the input or the abort reason.
 */
export function abortable<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  return new Promise((resolve, reject) => {
    const abort = () => reject(signal.reason);
    promise
      .then(resolve, reject)
      .finally(() => signal.removeEventListener('abort', abort));
    if (signal.aborted) {
      abort();
    } else {
      signal.addEventListener('abort', abort, { once: true });
    }
  });
}

/**
 * Wait for a duration, or reject with an abort signal's reason if the
 * signal aborts first.
 * @param ms The duration in milliseconds.
 * @param signal An optional abort signal.
 * @returns A promise that resolves after the duration.
 */
export function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason);
      return;
    }
    const abort = () => {
      clearTimeout(timer);
      reject(signal!.reason);
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', abort);
      resolve();
    }, ms);
    signal?.addEventListener('abort', abort, { once: true });
  });
}
