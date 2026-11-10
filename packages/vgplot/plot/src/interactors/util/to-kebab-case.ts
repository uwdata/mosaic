export function toKebabCase(cc) {
  const lc = cc.toLowerCase();
  const n = cc.length;
  let kc = '';
  for (let i = 0; i < n; ++i) {
    kc += (cc[i] !== lc[i] ? '-' : '') + lc[i];
  }
  return kc;
}
