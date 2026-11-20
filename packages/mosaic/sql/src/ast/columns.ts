import { COLUMNS } from '../constants.js';
import { ExprNode } from './node.js';

export class ColumnsNode extends ExprNode {
  /**
   * The column selector: a string literal regular expression, a list
   * of column name string literals, a lambda over column names, or a
   * star node.
   */
  readonly selector: ExprNode;
  /** Flag indicating an unpacked *COLUMNS expression. */
  readonly unpack: boolean;

  /**
   * Instantiate a COLUMNS expression node.
   * @param selector The column selector.
   * @param unpack Flag indicating an unpacked *COLUMNS expression.
   */
  constructor(selector: ExprNode, unpack: boolean = false) {
    super(COLUMNS);
    this.selector = selector;
    this.unpack = unpack;
  }
}
