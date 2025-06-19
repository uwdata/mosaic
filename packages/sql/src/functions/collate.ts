import type { ExprValue } from '../types.js';
import { CollateNode } from '../ast/collate.js';
import { asNode } from '../util/ast.js';

/**
 * Indicate ascending sort order for an expression.
 * @param expr The expression to collate.
 * @param collation The collation type, such as
 *  'NOCASE', 'NOACCENT', 'NFC', or locale-specific collations.
 */
export function collate(expr: ExprValue, collation: string) {
  return new CollateNode(asNode(expr), collation);
}
