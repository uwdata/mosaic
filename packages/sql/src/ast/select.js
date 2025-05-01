import { SELECT_CLAUSE } from '../constants.js';
import { quoteIdentifier } from '../util/string.js';
import { ColumnRefNode } from './column-ref.js';
import { ExprNode, SQLNode } from './node.js';

export class SelectClauseNode extends SQLNode {
  /**
   * Instantiate a select node.
   * @param {ExprNode} expr The select expression.
   * @param {string} alias The output name.
   */
  constructor(expr, alias) {
    super(SELECT_CLAUSE);
    /**
     * The select expression.
     * @type {ExprNode}
     * @readonly
     */
    this.expr = expr;
    /**
     * The output name.
     * @type {string}
     * @readonly
     */
    this.alias = alias;
  }

  /**
   * Generate a SQL query string for this node.
   * @returns {string}
   */
  toString() {
    const { expr, alias } = this;
    return !alias || isColumnRefFor(expr, alias)
      ? `${expr}`
      : `${expr} AS ${quoteIdentifier(alias)}`;
  }
}

function isColumnRefFor(expr, name) {
  return expr instanceof ColumnRefNode
    && expr.table == null
    && expr.column === name;
}
