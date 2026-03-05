import type { Query } from './query.js';
import { SCALAR_SUBQUERY } from '../constants.js';
import { ExprNode } from './node.js';

export class ScalarSubqueryNode extends ExprNode {
  /** The scalar subquery. */
  readonly subquery: Query;

  /**
   * Instantiate a scalar subquery node.
   * @param subquery The scalar subquery.
   */
  constructor(subquery: Query) {
    super(SCALAR_SUBQUERY);
    this.subquery = subquery;
  }
}
