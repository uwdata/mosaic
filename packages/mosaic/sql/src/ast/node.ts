import type { SQLCodeGenerator } from '../visit/codegen/sql.js';

/**
 * Check if a value is a SQL AST node.
 * @param value The value to check.
 */
export function isNode(value: unknown): value is SQLNode {
  return value instanceof SQLNode;
}

let _defaultVisitor: SQLCodeGenerator | undefined;

/**
 * Set the default visitor for toString operations.
 * This is used when no visitor is explicitly provided.
 */
export function setDefaultVisitor(visitor: SQLCodeGenerator) {
  _defaultVisitor = visitor;
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
    // @ts-expect-error use constructor with type
    const clone = new this.constructor(this.type);
    for (const key in this) {
      if (key !== 'type') { // Skip type since it's already set by constructor
        clone[key] = this[key];
      }
    }
    return clone;
  }

  /**
   * Generate a SQL query string for this node using a specific dialect visitor.
   * @param visitor Optional SQL visitor to use for string generation.
   *  If not provided, uses the default visitor.
   * @returns The SQL string representation.
   */
  toString(visitor: SQLCodeGenerator | undefined = _defaultVisitor): string {
    if (!visitor) {
      throw new Error('No visitor provided and no default visitor set.');
    }
    return visitor.toString(this);
  }
}

/**
 * AST node corresponding to an individual expression.
 */
export class ExprNode extends SQLNode {
}
