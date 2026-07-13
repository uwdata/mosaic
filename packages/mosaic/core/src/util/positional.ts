import type { ExprNode, LiteralNode, SelectClauseNode } from '@uwdata/mosaic-sql';

export function resolvePositional(expr: ExprNode, select: SelectClauseNode[]) {
  if (expr.type === 'LITERAL') {
    const { value } = (expr as LiteralNode);
    if (typeof value === 'number') {
      return select[value - 1];
    }
  }
}
