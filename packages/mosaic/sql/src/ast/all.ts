import { ALL } from '../constants.js';
import { ExprNode } from './node.js';

export class AllNode extends ExprNode {
  /**
   * Instantiate an ALL node, as used in GROUP BY ALL and ORDER BY ALL.
   */
  constructor() {
    super(ALL);
  }
}
