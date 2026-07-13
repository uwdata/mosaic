import type { ExprNode, LiteralNode, SelectClauseNode } from '@uwdata/mosaic-sql';

/**
 * Resolve a positional (1-based index) reference to a select clause entry.
 * Returns the corresponding select clause node if found, otherwise returns
 * undefined.
 * @param expr The SQL exprssion node to check.
 * @param select An array of select clause nodes.
 */
export function resolvePositional(expr: ExprNode, select: SelectClauseNode[]) {
  if (expr.type === 'LITERAL') {
    const { value } = (expr as LiteralNode);
    if (typeof value === 'number') {
      return select[value - 1];
    }
  }
}
