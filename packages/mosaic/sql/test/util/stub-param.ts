export function stubParam(value) {
  let cb = x => x;
  return {
    value,
    addEventListener(type, callback) { cb = callback; },
    removeEventListener(_type, _callback) { },
    update(v) { cb(this.value = v); }
  };
}
