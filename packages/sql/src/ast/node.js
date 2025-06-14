/**
 * Check if a value is a SQL AST node.
 * @param {*} value The value to check.
 * @returns {value is SQLNode}
 */
export function isNode(value) {
  return value instanceof SQLNode;
}

export class SQLNode {
  /**
   * Instantiate a SQL AST node.
   * @param {string} type The SQL AST node type.
   */
  constructor(type) {
    /**
     * The SQL AST node type.
     * @type {string}
     * @readonly
     */
    this.type = type;
  }

  /**
   * Create a shallow clone of this SQL AST node.
   * @returns {this} The shallow clone node.
   */
  clone() {
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
