import { LITERAL } from '../constants.js';
import { ExprNode } from './node.js';

export class LiteralNode extends ExprNode {
  /**
   * Instantiate an literal node.
   * @param {*} value The literal value.
   */
  constructor(value) {
    super(LITERAL);
    /**
     * The literal value.
     * @type {any}
     * @readonly
     */
    this.value = value;
  }

  /**
   * Generate a SQL query string for this node.
   * @returns {string}
   */
  toString() {
    return literalToSQL(this.value);
  }
}

export function literalToSQL(value) {
  switch (typeof value) {
    case 'number':
      return Number.isFinite(value) ? `${value}` : 'NULL';
    case 'string':
      return `'${value.replace(`'`, `''`)}'`;
    case 'boolean':
      return value ? 'TRUE' : 'FALSE';
    default:
      if (value == null) {
        return 'NULL';
      } else if (value instanceof Date) {
        const ts = +value;
        if (Number.isNaN(ts)) return 'NULL';
        const y = value.getUTCFullYear();
        const m = value.getUTCMonth();
        const d = value.getUTCDate();
        return ts === Date.UTC(y, m, d)
          ? `DATE '${y}-${m+1}-${d}'` // utc date
          : `epoch_ms(${ts})`; // timestamp
      } else if (value instanceof RegExp) {
        return `'${value.source}'`;
      } else {
        // otherwise rely on string coercion
        return `${value}`;
      }
  }
}
