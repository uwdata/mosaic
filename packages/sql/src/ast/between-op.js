import { BETWEEN_OPERATOR, NOT_BETWEEN_OPERATOR } from '../constants.js';
import { ExprNode } from './node.js';

class AbstractBetweenOpNode extends ExprNode {
  /**
   * Instantiate an abstract between operator node.
   * @param {string} type The node type.
   * @param {ExprNode} expr The input expression.
   * @param {[ExprNode, ExprNode]} extent The range extent.
   */
  constructor(type, expr, extent) {
    super(type);
    /**
     * The input expression.
     * @type {ExprNode}
     * @readonly
     */
    this.expr = expr;
    /**
     * The range extent.
     * @type {[ExprNode, ExprNode]}
     * @readonly
     */
    this.extent = extent;
  }

  /**
   * Generate a SQL query string for this node.
   * @returns {string}
   */
  toSQL(op) {
    const { extent: r, expr } = this;
    return r ? `(${expr} ${op} ${r[0]} AND ${r[1]})` : '';
  }
}

export class BetweenOpNode extends AbstractBetweenOpNode {
  /**
   * Instantiate a between operator node.
   * @param {ExprNode} expr The input expression.
   * @param {[ExprNode, ExprNode]} extent
   *  The range extent.
   */
  constructor(expr, extent) {
    super(BETWEEN_OPERATOR, expr, extent);
  }

  /**
   * Generate a SQL query string for this node.
   * @returns {string}
   */
  toString() {
    return super.toSQL('BETWEEN');
  }
}

export class NotBetweenOpNode extends AbstractBetweenOpNode {
  /**
   * Instantiate a not between operator node.
   * @param {ExprNode} expr The input expression.
   * @param {[ExprNode, ExprNode]} extent
   *  The range extent.
   */
  constructor(expr, extent) {
    super(NOT_BETWEEN_OPERATOR, expr, extent);
  }

  /**
   * Generate a SQL query string for this node.
   * @returns {string}
   */
  toString() {
    return super.toSQL('NOT BETWEEN');
  }
}
