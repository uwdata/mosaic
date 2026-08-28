import { LITERAL } from '../constants.js';
import { ExprNode } from './node.js';

export class LiteralNode extends ExprNode {
  /** The literal value. */
  readonly value: unknown;

  /**
   * Instantiate an literal node.
   * @param value The literal value.
   */
  constructor(value: unknown) {
    super(LITERAL);
    this.value = value;
  }
}
