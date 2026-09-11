export function stubParam(value: unknown) {
  let cb = (x: unknown) => x;
  return {
    value,
    addEventListener(type: string, callback: (x: unknown) => unknown) { cb = callback; },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    removeEventListener(type: string, callback: (x: unknown) => unknown) { },
    update(v: unknown) { cb(this.value = v); }
  };
}
