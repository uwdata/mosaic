export function stubParam(value) {
  let cb = x => x;
  return {
    value,
    addEventListener(type, callback) { cb = callback; },
    update(v) { cb(this.value = v); }
  };
}
