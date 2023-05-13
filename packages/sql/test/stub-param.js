export function stubParam(value) {
  let cb;
  return {
    value,
    addEventListener(type, callback) { cb = callback; },
    update(v) { cb(this.value = v); }
  };
}
