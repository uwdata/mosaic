import { LOGICAL_OPERATOR } from '../constants.js';
import { ExprNode } from './node.js';

export class LogicalOpNode<T extends ExprNode> extends ExprNode {
  /** The logical operator */
  readonly op: string;
  /** The clause expressions. */
  readonly clauses: T[];

  /**
   * Instantiate a logical operator node.
   * @param op The logical operation.
   * @param clauses The input clause expressions.
   */
  constructor(op: string, clauses: T[]) {
    super(LOGICAL_OPERATOR);
    this.op = op;
    this.clauses = clauses;
  }

  /**
   * Generate a SQL query string for this node.
   */
  toString() {
    const c = this.clauses;
    return c.length === 0 ? ''
      : c.length === 1 ? `${c[0]}`
      : `(${c.join(` ${this.op} `)})`;
  }
}

export class AndNode<T extends ExprNode> extends LogicalOpNode<T> {
  /**
   * Instantiate a logical AND operator node.
   * @param clauses The input clause expressions.
   */
  constructor(clauses: T[]) {
    super('AND', clauses);
  }
}

export class OrNode<T extends ExprNode> extends LogicalOpNode<T> {
  /**
   * Instantiate a logical OR operator node.
   * @param clauses The input clause expressions.
   */
  constructor(clauses: T[]) {
    super('OR', clauses);
  }
}
