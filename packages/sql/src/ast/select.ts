import type { ExprNode } from './node.js';
import { SELECT_CLAUSE } from '../constants.js';
import { quoteIdentifier } from '../util/string.js';
import { ColumnRefNode } from './column-ref.js';
import { SQLNode } from './node.js';

export class SelectClauseNode extends SQLNode {
  /** The select expression. */
  readonly expr?: ExprNode | null;
  /** The output name. */
  readonly alias: string;

  /**
   * Instantiate a select node.
   * @param expr The select expression.
   * @param alias The output name.
   */
  constructor(expr: ExprNode | null | undefined, alias: string) {
    super(SELECT_CLAUSE);
    this.expr = expr;
    this.alias = alias;
  }

  /**
   * Generate a SQL query string for this node.
   */
  toString() {
    const { expr, alias } = this;
    return !alias || isColumnRefFor(expr, alias)
      ? `${expr}`
      : `${expr} AS ${quoteIdentifier(alias)}`;
  }
}

function isColumnRefFor(expr: unknown, name: string): expr is ColumnRefNode {
  return expr instanceof ColumnRefNode
    && expr.table == null
    && expr.column === name;
}
