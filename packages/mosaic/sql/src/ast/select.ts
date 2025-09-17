import type { ExprNode } from './node.js';
import { SELECT_CLAUSE } from '../constants.js';
import { SQLNode } from './node.js';

export class SelectClauseNode extends SQLNode {
  /** The select expression. */
  readonly expr: ExprNode;
  /** The output name. */
  readonly alias: string;

  /**
   * Instantiate a select node.
   * @param expr The select expression.
   * @param alias The output name.
   */
  constructor(expr: ExprNode, alias: string) {
    super(SELECT_CLAUSE);
    this.expr = expr;
    this.alias = alias;
  }
}
