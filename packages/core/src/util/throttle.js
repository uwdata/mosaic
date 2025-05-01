const NIL = {};

/**
 * Throttle invocations of a callback function. The callback must return
 * a Promise. Upon repeated invocation, the callback will not be invoked
 * until a prior Promise resolves. If multiple invocations occurs while
 * waiting, only the most recent invocation will be pending.
 * @template E, T
 * @param {(event: E) => Promise<T>} callback The callback function.
 * @param {boolean} [debounce=true] Flag indicating if invocations
 *  should also be debounced within the current animation frame.
 * @returns {(event: E) => void} A new function that throttles
 *  access to the callback.
 */
export function throttle(callback, debounce = false) {
  let curr;
  let next;
  let pending = NIL;

  function invoke(event) {
    curr = callback(event)
      .catch(() => {})
      .finally(() => {
        if (next) {
          const { value } = next;
          next = null;
          invoke(value);
        } else {
          curr = null;
        }
      });
  }

  function enqueue(event) {
    next = { event };
  }

  function process(event) {
    curr ? enqueue(event) : invoke(event);
  }

  function delay(event) {
    if (pending !== event) {
      requestAnimationFrame(() => {
        const e = pending;
        pending = NIL;
        process(e);
      });
    }
    pending = event;
  }

  return debounce ? delay : process;
}
