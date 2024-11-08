import { ExprNode } from '../ast/node.js';
import { ParamNode } from '../ast/param.js';
import { TableRefNode } from '../ast/table-ref.js';
import { WindowDefNode } from '../ast/window.js';
import { column } from '../functions/column.js';
import { literal, verbatim } from '../functions/literal.js';
import { tableRef } from '../functions/table-ref.js';
import { parseIdentifier } from './string.js';
import { isArray, isParamLike, isString } from './type-check.js';

/**
 * Interpret a value as a SQL AST node. String values are assumed to be
 * column references. All other primitive values are interpreted as
 * SQL literals. Dynamic parameters are interpreted as param AST nodes,
 * while existing AST nodes are left as-is.
 * @param {*} value The value to interpret as a SQL AST node.
 * @returns {ExprNode}
 */
export function asNode(value) {
  return isString(value)
    ? parseColumnRef(value)
    : asLiteral(value);
}

/**
 * Interpret a value as a verbatim SQL AST node. String values will be
 * passed through to queries as verbatim text. All other primitive values
 * are interpreted as SQL literals. Dynamic parameters are interpreted
 * as param AST nodes, while existing AST nodes are left as-is.
 * @param {*} value The value to interpret as a verbatim AST node.
 * @returns {ExprNode}
 */
export function asVerbatim(value) {
  return isString(value)
    ? verbatim(value)
    : asLiteral(value);
}

/**
 * Interpret a value as a literal AST node. All other primitive values
 * are interpreted as SQL literals. Dynamic parameters are interpreted
 * as param AST nodes, while existing AST nodes are left as-is.
 * @param {*} value The value to interpret as a literal AST node.
 * @returns {ExprNode}
 */
export function asLiteral(value) {
  return value instanceof ExprNode ? value
    : isParamLike(value) ? new ParamNode(value)
    : literal(value);
}

/**
 * Interpret a value as a table reference AST node. String values are parsed
 * assuming dot ('.') delimiters (as in `schema.table`). Array values are
 * interpreted as pre-parsed name paths (as in `['schema', 'table']`). Any
 * other values are left as-is.
 * @param {string | string[] | TableRefNode} value The value to interpret as a
 *  table reference AST node.
 * @returns {TableRefNode}
 */
export function asTableRef(value) {
  return isString(value) ? parseTableRef(value)
    : isArray(value) ? tableRef(value)
    : value;
}

/**
 * Parse a string as a column reference, potentially with
 * dot ('.') delimited table, schema, and database references.
 * @param {string} ref The column reference string.
 * @returns {import('../ast/column-ref.js').ColumnRefNode}
 */
export function parseColumnRef(ref) {
  const ids = parseIdentifier(ref);
  return column(ids.pop(), tableRef(ids));
}

/**
 * Parse a string as a table reference, potentially with
 * dot ('.') delimited schema and database references.
 * @param {string} ref The table reference string.
 * @returns {import('../ast/table-ref.js').TableRefNode}
 */
export function parseTableRef(ref) {
  return tableRef(parseIdentifier(ref));
}

/**
 * Create a new window definition node. The return value is an empty
 * window definition. Use chained calls such as `partitionby` and `orderby`
 * to specify the window settings.
 * @returns {WindowDefNode}
 */
export function over() {
  return new WindowDefNode();
}
