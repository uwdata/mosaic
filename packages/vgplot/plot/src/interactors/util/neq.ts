export function neqSome(a: any[] | null | undefined, b: any[] | null | undefined): boolean {
  return (a == null || b == null)
    ? (a != null || b != null)
    : (a.length !== b.length || a.some((x, i) => neq(x, b[i])));
}

export function neq(a: any[], b: any[]): boolean {
  const n = a.length;
  if (b.length !== n) return true;
  for (let i = 0; i < n; ++i) {
    if (a[i] !== b[i]) return true;
  }
  return false;
}
