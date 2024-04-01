import { sql } from './expression.js';
import { asColumn } from './ref.js';

/**
 * Annotate an expression to indicate descending sort order.
 * Null values are ordered last.
 * @param {import('./expression.js').SQLExpression|string} expr A SQL expression or column name string.
 * @returns {import('./expression.js').SQLExpression} An expression with descending order.
 */
export function desc(expr) {
  const e = asColumn(expr);
  return sql`${e} DESC NULLS LAST`.annotate({ label: e?.label, desc: true });
}
