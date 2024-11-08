import { BINARY_OPERATOR } from '../constants.js';
import { ExprNode } from './node.js';

export class BinaryOpNode extends ExprNode {
  /**
   * Instantiate a binary operator node.
   * @param {string} op The operator type.
   * @param {ExprNode} left The left input expression.
   * @param {ExprNode} right The right input expression.
   */
  constructor(op, left, right) {
    super(BINARY_OPERATOR);
    /**
     * The operator type.
     * @type {string}
     * @readonly
     */
    this.op = op;
    /**
     * The left input expression.
     * @type {ExprNode}
     * @readonly
     */
    this.left = left;
    /**
     * The right input expression.
     * @type {ExprNode}
     * @readonly
     */
    this.right = right;
  }

  /**
   * Generate a SQL query string for this node.
   * @returns {string}
   */
  toString() {
    return `(${this.left} ${this.op} ${this.right})`;
  }
}
