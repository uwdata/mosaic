import { LITERAL } from '../constants.js';
import { ExprNode } from './node.js';

export class LiteralNode extends ExprNode {
  /** The literal value. */
  readonly value: unknown;

  /**
   * Instantiate an literal node.
   * @param value The literal value.
   */
  constructor(value: unknown) {
    super(LITERAL);
    this.value = value;
  }
}

export function literalToSQL(value: unknown): string {
  switch (typeof value) {
    case 'number':
      return Number.isFinite(value) ? `${value}` : 'NULL';
    case 'string':
      return `'${value.replaceAll(`'`, `''`)}'`;
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
        return `'${value.source.replaceAll(`'`, `''`)}'`;
      } else if (Array.isArray(value)) {
        // serialize as a DuckDB list literal
        return `[${value.map(v => literalToSQL(v)).join(', ')}]`;
      } else if (isPlainObject(value)) {
        // serialize as a DuckDB struct literal
        const fields = Object.entries(value)
          .map(([k, v]) => `${literalToSQL(k)}: ${literalToSQL(v)}`);
        return `{${fields.join(', ')}}`;
      } else {
        // otherwise rely on string coercion
        return `${value}`;
      }
  }
}

function isPlainObject(value: object): value is Record<string, unknown> {
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}
