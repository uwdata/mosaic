import type { ExprValue } from '../types.js';
import type { TableRefNode } from '../ast/table-ref.js';
import { ColumnsNode } from '../ast/columns.js';
import { LambdaNode } from '../ast/lambda.js';
import { ListNode } from '../ast/list.js';
import { LiteralNode } from '../ast/literal.js';
import { SelectClauseNode } from '../ast/select.js';
import { StarNode } from '../ast/star.js';
import { asNode, asTableRef } from '../util/ast.js';

export interface StarOptions {
  /** Names of columns to exclude. */
  exclude?: string[];
  /** A map from column names to replacement expressions. */
  replace?: Record<string, ExprValue>;
  /** A map from current column names to new column names. */
  rename?: Record<string, string>;
}

/**
 * Create a star (*) expression for all columns, with optional EXCLUDE,
 * REPLACE, and RENAME modifiers.
 * @param table The table reference, for a qualified star (table.*).
 * @param options The star modifiers.
 */
export function star(
  table?: string | string[] | TableRefNode | null,
  options: StarOptions = {}
) {
  const { exclude = [], replace = {}, rename = {} } = options;
  return new StarNode(
    asTableRef(table ?? undefined),
    exclude,
    Object.entries(replace).map(([name, expr]) => new SelectClauseNode(asNode(expr), name)),
    Object.entries(rename)
  );
}

/**
 * Create a COLUMNS expression that expands to multiple columns.
 * @param selector The column selector: a regular expression string,
 *  an array of column names, a lambda over column names, or a star node.
 * @param unpack Flag indicating an unpacked *COLUMNS expression, which
 *  expands to multiple function arguments.
 */
export function columns(
  selector: string | string[] | LambdaNode | StarNode,
  unpack: boolean = false
) {
  const node = typeof selector === 'string' ? new LiteralNode(selector)
    : Array.isArray(selector) ? new ListNode(selector.map(name => new LiteralNode(name)))
    : selector;
  return new ColumnsNode(node, unpack);
}
