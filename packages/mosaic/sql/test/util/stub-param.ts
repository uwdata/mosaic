export function stubParam(value) {
  let cb = x => x;
  return {
    value,
    addEventListener(type, callback) { cb = callback; },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    removeEventListener(type, callback) { },
    update(v) { cb(this.value = v); }
  };
}
