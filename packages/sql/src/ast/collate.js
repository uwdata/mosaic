import { COLLATE } from '../constants.js';
import { ExprNode } from './node.js';

export class CollateNode extends ExprNode {
  /**
   * Instantiate a collate node.
   * @param {ExprNode} expr The expression to collate.
   * @param {string} collation The collation type.
   */
  constructor(expr, collation) {
    super(COLLATE);
    /**
     * The expression to collate.
     * @type {ExprNode}
     * @readonly
     */
    this.expr = expr;
    /**
     * The collation type.
     * @type {string}
     * @readonly
     */
    this.collation = collation;
  }

  /**
   * Generate a SQL query string for this node.
   * @returns {string}
   */
  toString() {
    return `${this.expr} ${COLLATE} ${this.collation}`;
  }
}
