export function throttle(callback) {
  let curr = null;
  let next;

  function invoke(event) {
    curr = callback(event).then(() => {
      if (next) {
        const value = next;
        next = null;
        invoke(value);
      } else {
        curr = null;
      }
    });
  }

  function enqueue(event) {
    next = event;
  }

  return event => curr ? enqueue(event) : invoke(event);
}
