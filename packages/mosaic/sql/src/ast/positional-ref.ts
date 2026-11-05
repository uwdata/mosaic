import { POSITIONAL_REF } from '../constants.js';
import { ExprNode } from './node.js';

export class PositionalRefNode extends ExprNode {
  /** The 1-based column position. */
  readonly index: number;

  /**
   * Instantiate a positional column reference (#n) node. Within ORDER BY
   * clauses, positional references refer to select clause columns.
   * Elsewhere, they refer to columns of the FROM clause relation.
   * @param index The 1-based column position.
   */
  constructor(index: number) {
    super(POSITIONAL_REF);
    this.index = index;
  }
}
