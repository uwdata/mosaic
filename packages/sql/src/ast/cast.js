import { CAST } from '../constants.js';
import { ExprNode } from './node.js';

export class CastNode extends ExprNode {
  /**
   * Instantiate a cast node.
   * @param {ExprNode} expr The expression to type cast.
   * @param {string} type The type to cast to.
   */
  constructor(expr, type) {
    super(CAST);
    /**
     * The expression to type cast.
     * @type {ExprNode}
     * @readonly
     */
    this.expr = expr;
    /**
     * The type to cast to.
     * @type {string}
     * @readonly
     */
    this.cast = type;
  }

  /**
   * Generate a SQL query string for this node.
   * @returns {string}
   */
  toString() {
    // TODO? could include check to see if parens are necessary
    return `(${this.expr})::${this.cast}`;
  }
}
