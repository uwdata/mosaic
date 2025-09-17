import type { TableRefNode } from './table-ref.js';
import { COLUMN_REF } from '../constants.js';
import { ExprNode } from './node.js';

/**
 * Check if a value is a column reference node.
 * @param value The value to check.
 */
export function isColumnRef(value: unknown): value is ColumnRefNode {
  return value instanceof ColumnRefNode;
}

export class ColumnRefNode extends ExprNode {
  /** The table reference. */
  readonly table?: TableRefNode;

  /**
   * Instantiate a column reference node.
   * @param type The AST node type.
   * @param table The table reference.
   */
  constructor(type: string, table?: TableRefNode) {
    super(type);
    this.table = table;
  }

  /**
   * Returns the column name.
   */
  get column() {
    return ''; // subclasses to override
  }
}

export class ColumnNameRefNode extends ColumnRefNode {
  /** The column name. */
  readonly name: string;

  /**
   * Instantiate a column reference node.
   * @param name The column name.
   * @param table The table reference.
   */
  constructor(name: string, table?: TableRefNode) {
    super(COLUMN_REF, table);
    this.name = name;
  }

  /**
   * Returns the column name.
   */
  get column() {
    return this.name;
  }
}
