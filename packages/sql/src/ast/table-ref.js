import { TABLE_REF } from '../constants.js';
import { quoteIdentifier } from '../util/string.js';
import { ExprNode } from './node.js';

/**
 * Check if a value is a table reference node.
 * @param {*} value The value to check.
 * @returns {value is TableRefNode}
 */
export function isTableRef(value) {
  return value instanceof TableRefNode;
}

export class TableRefNode extends ExprNode {
  /**
   * Instantiate a table reference node.
   * @param {string | string[]} table The table name.
   */
  constructor(table) {
    super(TABLE_REF);
    /**
     * The table name, including namespaces.
     * @type {string[]}
     * @readonly
     */
    this.table = [table].flat();
  }

  /**
   * The table name without database or schema namespaces.
   * @returns {string}
   */
  get name() {
    return this.table[this.table.length - 1];
  }

  /**
   * Generate a SQL query string for this node.
   * @returns {string}
   */
  toString() {
    return this.table.map(t => quoteIdentifier(t)).join('.');
  }
}
