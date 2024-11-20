import { COLUMN_REF } from '../constants.js';
import { quoteIdentifier } from '../util/string.js';
import { ExprNode } from './node.js';

/**
 * Check if a value is a column reference node.
 * @param {*} value The value to check.
 * @returns {value is ColumnRefNode}
 */
export function isColumnRef(value) {
  return value instanceof ColumnRefNode;
}

export class ColumnRefNode extends ExprNode {
  /**
   * Instantiate a column reference node.
   * @param {import('./table-ref.js').TableRefNode} [table] The table reference.
   */
  constructor(type, table) {
    super(type);
    /**
     * The table reference.
     * @type {import('./table-ref.js').TableRefNode}
     * @readonly
     */
    this.table = table;
  }

  /**
   * Returns the column name.
   * @returns {string}
   */
  get column() {
    return null; // subclasses to override
  }

  /**
   * Generate a SQL query string for this node.
   * @returns {string}
   */
  toString() {
    const { column, table } = this;
    const tref = `${table ?? ''}`;
    const id = column === '*' ? '*' : quoteIdentifier(column);
    return (tref ? (tref + '.') : '') + id;
  }
}

export class ColumnNameRefNode extends ColumnRefNode {
  /**
   * Instantiate a column reference node.
   * @param {string} name The column name.
   * @param {import('./table-ref.js').TableRefNode} [table] The table reference.
   */
  constructor(name, table) {
    super(COLUMN_REF, table);
    /**
     * The column name.
     * @type {string}
     * @readonly
     */
    this.name = name;
  }

  /**
   * Returns the column name.
   * @returns {string}
   */
  get column() {
    return this.name;
  }
}
