import { TABLE_REF } from '../constants.js';
import { ExprNode } from './node.js';

/**
 * Check if a value is a table reference node.
 * @param value The value to check.
 */
export function isTableRef(value: unknown): value is TableRefNode {
  return value instanceof TableRefNode;
}

export class TableRefNode extends ExprNode {
  /** The table name, including namespaces. */
  readonly table: string[];

  /**
   * Instantiate a table reference node.
   * @param table The table name.
   */
  constructor(table: string | string[]) {
    super(TABLE_REF);
    this.table = [table].flat();
  }

  /**
   * The table name without database or schema namespaces.
   */
  get name() {
    return this.table[this.table.length - 1];
  }


}
