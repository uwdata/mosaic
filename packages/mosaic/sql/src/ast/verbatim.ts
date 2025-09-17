import { VERBATIM } from '../constants.js';
import { ExprNode } from './node.js';

export class VerbatimNode extends ExprNode {
  /** The verbatim content to include. */
  readonly value: string;
  /** A type hint for analyzing verbatim content. */
  readonly hint?: string;

  /**
   * Instantiate a raw node with verbatim content.
   * @param value The verbatim content to include.
   * @param hint A type hint for analyzing verbatim content.
   */
  constructor(value: string, hint?: string) {
    super(VERBATIM);
    this.value = value;
    this.hint = hint;
  }


}
