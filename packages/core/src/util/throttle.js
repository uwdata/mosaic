const NIL = {};

export function throttle(callback, debounce = false) {
  let curr;
  let next;
  let pending = NIL;

  function invoke(event) {
    curr = callback(event).then(() => {
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
