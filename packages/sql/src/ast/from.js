/** @import { SampleClauseNode } from './sample.js' */
import { FROM_CLAUSE } from '../constants.js';
import { quoteIdentifier } from '../util/string.js';
import { SQLNode } from './node.js';
import { isQuery } from './query.js';
import { isTableRef } from './table-ref.js';

export class FromClauseNode extends SQLNode {
  /**
   * Instantiate a from node.
   * @param {SQLNode} expr The from expression.
   * @param {string} [alias] The output name.
   * @param {SampleClauseNode} [sample] The table sample.
   */
  constructor(expr, alias, sample) {
    super(FROM_CLAUSE);
    /**
     * The from expression.
     * @type {SQLNode}
     * @readonly
     */
    this.expr = expr;
    /**
     * The output name.
     * @type {string}
     * @readonly
     */
    this.alias = alias;
    /**
     * The table sample.
     * @type {SampleClauseNode}
     * @readonly
     */
    this.sample = sample;
  }

  /**
   * Generate a SQL query string for this node.
   * @returns {string}
   */
  toString() {
    const { expr, alias, sample } = this;
    const ref = isQuery(expr) ? `(${expr})` : `${expr}`;
    const from = alias && !(isTableRef(expr) && expr.table.join('.') === alias)
      ? `${ref} AS ${quoteIdentifier(alias)}`
      : `${ref}`;
    return `${from}${sample ? ` TABLESAMPLE ${sample}` : ''}`;
  }
}
