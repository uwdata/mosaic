import { sql } from './expression.js';
import { asColumn } from './ref.js';

export function cast(expr, type) {
  const e = asColumn(expr);
  return sql`CAST(${e} AS ${type})`.annotate(
    e.label != null ? { label: e.label } : null,
    e.aggregate != null ? { aggregate: e.aggregate } : null
  );
}

export const castDouble = expr => cast(expr, 'DOUBLE');
export const castInteger = expr => cast(expr, 'INTEGER');
