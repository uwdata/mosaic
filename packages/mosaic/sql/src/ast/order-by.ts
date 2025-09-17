import { ORDER_BY } from '../constants.js';
import { ExprNode } from './node.js';

export class OrderByNode extends ExprNode {
  /** The expression to order by. */
  readonly expr: ExprNode;
  /** Flag indicating descending order. */
  readonly desc?: boolean;
  /** Flag indicating if null values should be sorted first. */
  readonly nullsFirst?: boolean;

  /**
   * Instantiate an order by entry node.
   * @param expr The expression to order by.
   * @param desc Flag indicating descending order.
   * @param nullsFirst Flag indicating if null values should be sorted first.
   */
  constructor(expr: ExprNode, desc?: boolean, nullsFirst?: boolean) {
    super(ORDER_BY);
    this.expr = expr;
    this.desc = desc;
    this.nullsFirst = nullsFirst;
  }
}
