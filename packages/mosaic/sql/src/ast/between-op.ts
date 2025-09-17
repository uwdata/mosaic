import { BETWEEN_OPERATOR, NOT_BETWEEN_OPERATOR } from '../constants.js';
import { ExprNode } from './node.js';

export type Extent = [ExprNode, ExprNode] | null;

class AbstractBetweenOpNode extends ExprNode {
  /** The input expression. */
  readonly expr: ExprNode;
  /** The range extent. */
  readonly extent?: Extent;

  /**
   * Instantiate an abstract between operator node.
   * @param type The node type.
   * @param expr The input expression.
   * @param extent The range extent.
   */
  constructor(type: string, expr: ExprNode, extent?: Extent) {
    super(type);
    this.expr = expr;
    this.extent = extent;
  }

  /**
   * Generate a SQL query string for this node.
   * @param op The operator to apply.
   */
  toSQL(op: string) {
    const { extent: r, expr } = this;
    return r ? `(${expr} ${op} ${r[0]} AND ${r[1]})` : '';
  }
}

export class BetweenOpNode extends AbstractBetweenOpNode {
  /**
   * Instantiate a between operator node.
   * @param expr The input expression.
   * @param extent The range extent.
   */
  constructor(expr: ExprNode, extent?: Extent) {
    super(BETWEEN_OPERATOR, expr, extent);
  }


}

export class NotBetweenOpNode extends AbstractBetweenOpNode {
  /**
   * Instantiate a not between operator node.
   * @param expr The input expression.
   * @param extent The range extent.
   */
  constructor(expr: ExprNode, extent?: Extent) {
    super(NOT_BETWEEN_OPERATOR, expr, extent);
  }


}
