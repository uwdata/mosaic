import { LOGICAL_OPERATOR } from '../constants.js';
import { ExprNode } from './node.js';

/**
 * @template {ExprNode} T
 */
export class LogicalOpNode extends ExprNode {
  /**
   * Instantiate a logical operator node.
   * @param {string} op The logical operation.
   * @param {T[]} clauses The input clause expressions.
   */
  constructor(op, clauses) {
    super(LOGICAL_OPERATOR);
    /**
     * The logical operator.
     * @type {string}
     * @readonly
     */
    this.op = op;
    /**
     * The input clause expressions.
     * @type {T[]}
     * @readonly
     */
    this.clauses = clauses;
  }

  /**
   * Generate a SQL query string for this node.
   * @returns {string}
   */
  toString() {
    const c = this.clauses;
    return c.length === 0 ? ''
      : c.length === 1 ? `${c[0]}`
      : `(${c.join(` ${this.op} `)})`;
  }
}

/**
 * @template {ExprNode} T
 * @extends {LogicalOpNode<T>}
 */
export class AndNode extends LogicalOpNode {
  /**
   * Instantiate a logical AND operator node.
   * @param {T[]} clauses The input clause expressions.
   */
  constructor(clauses) {
    super('AND', clauses);
  }
}

/**
 * @template {ExprNode} T
 * @extends {LogicalOpNode<T>}
 */
export class OrNode extends LogicalOpNode {
  /**
   * Instantiate a logical OR operator node.
   * @param {T[]} clauses The input clause expressions.
   */
  constructor(clauses) {
    super('OR', clauses);
  }
}
