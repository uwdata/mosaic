import type { SelectClauseNode } from './select.js';
import type { TableRefNode } from './table-ref.js';
import { ColumnNameRefNode } from './column-ref.js';

export class StarNode extends ColumnNameRefNode {
  /** Names of columns to exclude. */
  readonly exclude: string[];
  /** Replacement expressions, with the replaced column names as aliases. */
  readonly replace: SelectClauseNode[];
  /** Pairs of [current name, new name] for columns to rename. */
  readonly rename: [string, string][];

  /**
   * Instantiate a star (*) node with EXCLUDE, REPLACE, and RENAME
   * modifiers. Star nodes are column references for the column name
   * '*', so that column analyses treat them as referencing all columns.
   * @param table The table reference.
   * @param exclude Names of columns to exclude.
   * @param replace Replacement expressions, with the replaced column
   *  names as aliases.
   * @param rename Pairs of [current name, new name] for columns to rename.
   */
  constructor(
    table?: TableRefNode,
    exclude: string[] = [],
    replace: SelectClauseNode[] = [],
    rename: [string, string][] = []
  ) {
    super('*', table);
    this.exclude = exclude;
    this.replace = replace;
    this.rename = rename;
  }
}
