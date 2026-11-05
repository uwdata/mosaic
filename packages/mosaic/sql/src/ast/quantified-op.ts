import { QUANTIFIED_OPERATOR } from '../constants.js';
import { ExprNode } from './node.js';
import type { ScalarSubqueryNode } from './subquery.js';

export type ComparisonOp = '=' | '<>' | '!=' | '<' | '>' | '<=' | '>=';
export type Quantifier = 'ANY' | 'ALL';

export class QuantifiedOpNode extends ExprNode {
  /** The comparison operator. */
  readonly op: ComparisonOp;
  /** The input expression. */
  readonly expr: ExprNode;
  /** The quantifier, either ANY or ALL. */
  readonly quantifier: Quantifier;
  /** The subquery to compare against. */
  readonly subquery: ScalarSubqueryNode;

  /**
   * Instantiate a quantified comparison operator node.
   * @param op The comparison operator.
   * @param expr The input expression.
   * @param quantifier The quantifier, either ANY or ALL.
   * @param subquery The subquery to compare against.
   */
  constructor(
    op: ComparisonOp,
    expr: ExprNode,
    quantifier: Quantifier,
    subquery: ScalarSubqueryNode
  ) {
    super(QUANTIFIED_OPERATOR);
    this.op = op;
    this.expr = expr;
    this.quantifier = quantifier;
    this.subquery = subquery;
  }
}
