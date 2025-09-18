import { FUNCTION } from '../constants.js';
import { ExprNode } from './node.js';

export class FunctionNode extends ExprNode {
  /** The function name. */
  readonly name: string;
  /** The function arguments. */
  readonly args: ExprNode[];

  /**
   * Instantiate a function node.
   * @param name The function name.
   * @param args The function arguments.
   */
  constructor(name: string, args: ExprNode[] = []) {
    super(FUNCTION);
    this.name = name;
    this.args = args;
  }
}
