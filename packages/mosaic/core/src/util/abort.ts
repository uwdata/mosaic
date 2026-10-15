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
