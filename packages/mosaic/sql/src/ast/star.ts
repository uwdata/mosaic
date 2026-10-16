import type { SelectClauseNode } from './select.js';
import type { TableRefNode } from './table-ref.js';
import { type ColumnRefNode, ColumnNameRefNode } from './column-ref.js';

export class StarNode extends ColumnNameRefNode {
  /** Columns to exclude, optionally qualified by table. */
  readonly exclude: ColumnRefNode[];
  /** Replacement expressions, with the replaced column names as aliases. */
  readonly replace: SelectClauseNode[];
  /**
   * Pairs of [current column, new name] for columns to rename. The
   * current column may be qualified by table.
   */
  readonly rename: [ColumnRefNode, string][];

  /**
   * Instantiate a star (*) node with EXCLUDE, REPLACE, and RENAME
   * modifiers. Star nodes are column references for the column name
   * '*', so that column analyses treat them as referencing all columns.
   * @param table The table reference.
   * @param exclude Columns to exclude, optionally qualified by table.
   * @param replace Replacement expressions, with the replaced column
   *  names as aliases.
   * @param rename Pairs of [current column, new name] for columns to
   *  rename. The current column may be qualified by table.
   */
  constructor(
    table?: TableRefNode,
    exclude: ColumnRefNode[] = [],
    replace: SelectClauseNode[] = [],
    rename: [ColumnRefNode, string][] = []
  ) {
    super('*', table);
    this.exclude = exclude;
    this.replace = replace;
    this.rename = rename;
  }
}
