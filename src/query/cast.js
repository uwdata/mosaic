export function cast(expr, type) {
  return `CAST(${expr} AS ${type})`;
}
