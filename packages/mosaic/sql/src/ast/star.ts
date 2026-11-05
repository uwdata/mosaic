import type { SelectClauseNode } from './select.js';
import type { TableRefNode } from './table-ref.js';
import { type ColumnRefNode, ColumnNameRefNode } from './column-ref.js';

export class StarNode extends ColumnNameRefNode {
  /** Columns to exclude, optionally qualified by table. */
  readonly exclude: ColumnRefNode[];
  /** Replacement expressions, with the replaced column names as aliases. */
  readonly replace: SelectClauseNode[];
  /**
   * Columns to rename, with the new names as aliases. The current
   * columns may be qualified by table.
   */
  readonly rename: SelectClauseNode[];

  /**
   * Instantiate a star (*) node with EXCLUDE, REPLACE, and RENAME
   * modifiers. Star nodes are column references for the column name
   * '*', so that column analyses treat them as referencing all columns.
   * @param table The table reference.
   * @param exclude Columns to exclude, optionally qualified by table.
   * @param replace Replacement expressions, with the replaced column
   *  names as aliases.
   * @param rename Columns to rename, with the new names as aliases.
   *  The current columns may be qualified by table.
   */
  constructor(
    table?: TableRefNode,
    exclude: ColumnRefNode[] = [],
    replace: SelectClauseNode[] = [],
    rename: SelectClauseNode[] = []
  ) {
    super('*', table);
    this.exclude = exclude;
    this.replace = replace;
    this.rename = rename;
  }
}
