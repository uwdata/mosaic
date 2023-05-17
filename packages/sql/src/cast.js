import { sql } from './expression.js';
import { asColumn } from './ref.js';

export function cast(expr, type) {
  const arg = asColumn(expr);
  const e = sql`CAST(${arg} AS ${type})`;
  Object.defineProperty(e, 'label', {
    enumerable: true,
    get() { return expr.label; }
  });
  Object.defineProperty(e, 'aggregate', {
    enumerable: true,
    get() { return expr.aggregate || false; }
  });
  return e;
}

export const castDouble = expr => cast(expr, 'DOUBLE');
export const castInteger = expr => cast(expr, 'INTEGER');
