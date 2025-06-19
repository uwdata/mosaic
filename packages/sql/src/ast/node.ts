/**
 * Check if a value is a SQL AST node.
 * @param value The value to check.
 */
export function isNode(value: unknown): value is SQLNode {
  return value instanceof SQLNode;
}

export class SQLNode {
  /** The SQL AST node type. */
  readonly type: string;

  /**
   * Instantiate a SQL AST node.
   * @param type The SQL AST node type.
   */
  constructor(type: string) {
    this.type = type;
  }

  /**
   * Create a shallow clone of this SQL AST node.
   * @returns The shallow clone node.
   */
  clone(): this {
    // @ts-expect-error
    const clone = new this.constructor();
    for (const key in this) {
      clone[key] = this[key];
    }
    return clone;
  }
}

/**
 * AST node corresponding to an individual expression.
 */
export class ExprNode extends SQLNode {
}
