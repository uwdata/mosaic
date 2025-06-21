import type { SampleClauseNode } from './sample.js';
import { FROM_CLAUSE } from '../constants.js';
import { quoteIdentifier } from '../util/string.js';
import { SQLNode } from './node.js';
import { isQuery } from './query.js';
import { isTableRef } from './table-ref.js';

export class FromClauseNode extends SQLNode {
  /** The from expression. */
  readonly expr: SQLNode;
  /** The output name. */
  readonly alias?: string;
  /** The table sample. */
  readonly sample?: SampleClauseNode;

  /**
   * Instantiate a from node.
   * @param expr The from expression.
   * @param alias The output name.
   * @param sample The table sample.
   */
  constructor(expr: SQLNode, alias?: string, sample?: SampleClauseNode) {
    super(FROM_CLAUSE);
    this.expr = expr;
    this.alias = alias;
    this.sample = sample;
  }

  /**
   * Generate a SQL query string for this node.
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
