import { UNNEST } from '../constants.js';
import { ExprNode } from './node.js';

export class UnnestNode extends ExprNode {
  /** An expression that resolves to a list or a struct */
  readonly expr: ExprNode;
  readonly recursive: boolean;
  readonly maxDepth: number;

  /**
   * Instantiate an Unnest node.
   * @param expr
   * @param recursive
   * @param maxDepth
   */
  constructor(expr: ExprNode, recursive = false, maxDepth = 0) {
    super(UNNEST);
    this.expr = expr;
    this.recursive = recursive;
    this.maxDepth = maxDepth;
  }

  /**
   * Generate a SQL query string for this node.
   */
  toString() {
    const recursive = this.recursive ? ', recursive := true' : '';
    const maxDepth = this.maxDepth > 0 ? `, max_depth := ${this.maxDepth}` : '';
    return `UNNEST(${this.expr}${recursive}${maxDepth})`;
  }
}
