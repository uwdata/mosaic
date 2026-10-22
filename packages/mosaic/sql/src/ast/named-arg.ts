import { NAMED_ARG } from '../constants.js';
import { ExprNode } from './node.js';

export class NamedArgNode extends ExprNode {
  /** The argument name. */
  readonly name: string;
  /** The argument value. */
  readonly expr: ExprNode;

  /**
   * Instantiate a named function argument node.
   * @param name The argument name.
   * @param expr The argument value.
   */
  constructor(name: string, expr: ExprNode) {
    super(NAMED_ARG);
    this.name = name;
    this.expr = expr;
  }
}
