import { UNARY_OPERATOR, UNARY_POSTFIX_OPERATOR } from '../constants.js';
import { ExprNode } from './node.js';

class AbstractUnaryOpNode extends ExprNode {
  /**
   * Instantiate an abstract unary operator node.
   * @param {string} type The node type.
   * @param {string} op The operator type.
   * @param {ExprNode} expr The input expression.
   */
  constructor(type, op, expr) {
    super(type);
    /**
     * The operator type.
     * @type {string}
     * @readonly
     */
    this.op = op;
    /**
     * The input expression.
     * @type {ExprNode}
     * @readonly
     */
    this.expr = expr;
  }
}

export class UnaryOpNode extends AbstractUnaryOpNode {
  /**
   * Instantiate a unary operator node.
   * @param {string} op The operator type.
   * @param {ExprNode} expr The input expression.
   */
  constructor(op, expr) {
    super(UNARY_OPERATOR, op, expr);
  }

  /**
   * Generate a SQL query string for this node.
   * @returns {string}
   */
  toString() {
    return `(${this.op} ${this.expr})`;
  }
}

export class UnaryPosftixOpNode extends AbstractUnaryOpNode {
  /**
   * Instantiate a unary operator node.
   * @param {string} op The operator type.
   * @param {ExprNode} expr The input expression.
   */
  constructor(op, expr) {
    super(UNARY_POSTFIX_OPERATOR, op, expr);
  }

  /**
   * Generate a SQL query string for this node.
   * @returns {string}
   */
  toString() {
    return `(${this.expr} ${this.op})`;
  }
}
