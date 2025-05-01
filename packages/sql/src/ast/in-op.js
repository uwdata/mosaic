import { IN_OPERATOR } from '../constants.js';
import { ExprNode } from './node.js';

export class InOpNode extends ExprNode {
  /**
   * Instantiate an in operator node.
   * @param {ExprNode} expr The input expression.
   * @param {ExprNode[]} values The value set.
   */
  constructor(expr, values) {
    super(IN_OPERATOR);
    /**
     * The input expression.
     * @type {ExprNode}
     * @readonly
     */
    this.expr = expr;
    /**
     * The value set.
     * @type {ExprNode[]}
     * @readonly
     */
    this.values = values;
  }

  /**
   * Generate a SQL query string for this node.
   * @returns {string}
   */
  toString() {
    return `(${this.expr} IN (${this.values.join(', ')}))`;
  }
}
