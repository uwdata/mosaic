const NIL = {};

interface QueueItem<E> {
  event: E;
}

/**
 * Throttle invocations of a callback function. The callback must return
 * a Promise. Upon repeated invocation, the callback will not be invoked
 * until a prior Promise resolves. If multiple invocations occurs while
 * waiting, only the most recent invocation will be pending.
 * @param callback The callback function.
 * @param debounce Flag indicating if invocations
 *  should also be debounced within the current animation frame.
 * @returns A new function that throttles access to the callback.
 */
export function throttle<E, T>(
  callback: (event?: E) => Promise<T> | null,
  debounce: boolean = false
): (event?: E) => void {
  let curr: Promise<unknown> | null;
  let next: QueueItem<E> | undefined | null;
  let pending: E | undefined | typeof NIL = NIL;

  function invoke(event?: E): void {
    curr = callback(event)
      ?.catch(() => {})
      .finally(() => {
        if (next) {
          const { event: value } = next;
          next = null;
          invoke(value);
        } else {
          curr = null;
        }
      }) || null;
  }

  function enqueue(event: E): void {
    next = { event };
  }

  function process(event?: E): void {
    if (curr) enqueue(event!); else invoke(event);
  }

  function delay(event?: E): void {
    if (pending !== event) {
      requestAnimationFrame(() => {
        const e = pending as E;
        pending = NIL;
        process(e);
      });
    }
    pending = event;
  }

  return debounce ? delay : process;
}