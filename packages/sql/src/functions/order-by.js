import { OrderByNode } from '../ast/order-by.js';
import { asNode } from '../util/ast.js';

/**
 * Indicate ascending sort order for an expression.
 * @param {import('../types.js').ExprValue} expr An expression to order by.
 * @param {boolean | undefined} [nullsFirst] Flag indicating if null values
 *  should be sorted first.
 * @returns {OrderByNode}
 */
export function asc(expr, nullsFirst) {
  return new OrderByNode(asNode(expr), false, nullsFirst);
}

/**
 * Indicate descending sort order for an expression.
 * @param {import('../types.js').ExprValue} expr An expression to order by.
 * @param {boolean | undefined} [nullsFirst] Flag indicating if null values
 *  should be sorted first.
 * @returns {OrderByNode}
 */
export function desc(expr, nullsFirst) {
  return new OrderByNode(asNode(expr), true, nullsFirst);
}
