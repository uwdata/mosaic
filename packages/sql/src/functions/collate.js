/**
 * @import { ExprValue } from '../types.js'
 */
import { CollateNode } from '../ast/collate.js';
import { asNode } from '../util/ast.js';

/**
 * Indicate ascending sort order for an expression.
 * @param {ExprValue} expr The expression to collate.
 * @param {string} collation The collation type, such as
 *  'NOCASE', 'NOACCENT', 'NFC', or locale-specific collations.
 * @returns {CollateNode}
 */
export function collate(expr, collation) {
  return new CollateNode(asNode(expr), collation);
}
