import type { ExprValue } from '../types.js';
import { OrderByNode } from '../ast/order-by.js';
import { asNode } from '../util/ast.js';

/**
 * Indicate ascending sort order for an expression.
 * @param expr An expression to order by.
 * @param nullsFirst Flag indicating if null values should be sorted first.
 */
export function asc(expr: ExprValue, nullsFirst?: boolean) {
  return new OrderByNode(asNode(expr), false, nullsFirst);
}

/**
 * Indicate descending sort order for an expression.
 * @param expr An expression to order by.
 * @param nullsFirst Flag indicating if null values should be sorted first.
 */
export function desc(expr: ExprValue, nullsFirst?: boolean) {
  return new OrderByNode(asNode(expr), true, nullsFirst);
}
