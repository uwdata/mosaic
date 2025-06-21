// Fowler/Noll/Vo hashing.
export function fnv_hash(v: string): number {
  let a = 2166136261;
  for (let i = 0, n = v.length; i < n; ++i) {
    const c = v.charCodeAt(i);
    const d = c & 0xff00;
    if (d) a = fnv_multiply(a ^ d >> 8);
    a = fnv_multiply(a ^ c & 0xff);
  }
  return fnv_mix(a) >>> 0; // ensure non-zero value
}

// a * 16777619 mod 2**32
function fnv_multiply(a: number): number {
  return a + (a << 1) + (a << 4) + (a << 7) + (a << 8) + (a << 24);
}

// See https://web.archive.org/web/20131019013225/http://home.comcast.net/~bretm/hash/6.html
function fnv_mix(a: number): number {
  a += a << 13;
  a ^= a >>> 7;
  a += a << 3;
  a ^= a >>> 17;
  a += a << 5;
  return a & 0xffffffff;
}