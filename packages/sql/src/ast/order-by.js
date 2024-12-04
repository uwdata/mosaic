import { ORDER_BY } from '../constants.js';
import { ExprNode } from './node.js';

export class OrderByNode extends ExprNode {
  /**
   * Instantiate an order by entry node.
   * @param {ExprNode} expr The expression to order by.
   * @param {boolean | undefined} [desc] Flag indicating descending order.
   * @param {boolean | undefined} [nullsFirst] Flag indicating if null
   *  values should be sorted first.
   */
  constructor(expr, desc, nullsFirst) {
    super(ORDER_BY);
    /**
     * The expression to order by.
     * @type {ExprNode}
     * @readonly
     */
    this.expr = expr;
    /**
     * Flag indicating descending order.
     * @type {boolean | undefined}
     * @readonly
     */
    this.desc = desc;
    /**
     * Flag indicating if null values should be sorted first.
     * @type {boolean | undefined}
     * @readonly
     */
    this.nullsFirst = nullsFirst;
  }

  /**
   * Generate a SQL query string for this node.
   * @returns {string}
   */
  toString() {
    const { expr, desc, nullsFirst } = this;
    const dir = desc ? ' DESC'
      : desc === false ? ' ASC'
      : '';
    const nf = nullsFirst ? ' NULLS FIRST'
      : nullsFirst === false ? ' NULLS LAST'
      : '';
    return `${expr}${dir}${nf}`;
  }
}
