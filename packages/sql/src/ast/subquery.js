/** @import { Query } from './query.js' */
import { SCALAR_SUBQUERY } from '../constants.js';
import { ExprNode } from './node.js';

export class ScalarSubqueryNode extends ExprNode {
  /**
   * Instantiate a scalar subquery node.
   * @param {Query} subquery The scalar subquery.
   */
  constructor(subquery) {
    super(SCALAR_SUBQUERY);
    /**
     * The scalar subquery.
     * @type {Query}
     * @readonly
     */
    this.subquery = subquery;
  }

  toString() {
    return `(${this.subquery})`;
  }
}
