import { type AggregateNode, aggregateNames } from '../ast/aggregate.js';
import type { ColumnsNode } from '../ast/columns.js';
import { type ColumnRefNode, ColumnNameRefNode } from '../ast/column-ref.js';
import type { LiteralNode } from '../ast/literal.js';
import type { ListNode } from '../ast/list.js';
import type { SQLNode } from '../ast/node.js';
import type { ParamNode } from '../ast/param.js';
import { StarNode } from '../ast/star.js';
import { AGGREGATE, COLUMN_PARAM, COLUMN_REF, COLUMNS, FRAGMENT, LIST, LITERAL, PARAM, POSITIONAL_REF, SCALAR_SUBQUERY, VERBATIM, WINDOW } from '../constants.js';
import type { ParamLike } from '../types.js';
import { walk } from './walk.js';

// regexp to match valid aggregate function names
const aggrRegExp = new RegExp(`^(${aggregateNames.join('|')})$`);

// regexp to tokenize sql text in order to find function calls
// includes checks to avoid analyzing text within quoted strings
// function call tokens will have a pattern like "name(" or "name (".
const funcRegExp = /(\\'|\\"|"(?:\\"|[^"])*"|'(?:\\'|[^'])*'|\w+\s*\()/g;

// regexp to match window function calls with inline or named definitions
const windowRegExp = /\)\s*over(\s*\(|\s+[\w"])/;

// regexp to match the start of a scalar subquery
const subqueryRegExp = /\(\s*select\b/;

// paren counting does not recognize string literals, so a ')' quoted
// inside a subquery ends that subquery early
function stripSubqueries(s: string) {
  for (let i = s.search(subqueryRegExp); i >= 0; i = s.search(subqueryRegExp)) {
    let depth = 1;
    let end = i + 1;
    while (depth > 0 && end < s.length) {
      const c = s[end++];
      if (c === '(') ++depth;
      else if (c === ')') --depth;
    }
    s = s.slice(0, i) + s.slice(end);
  }
  return s;
}

function hasVerbatimAggregate(s: string) {
  return s
    .split(funcRegExp)
    .some(tok => tok.endsWith('(') && aggrRegExp.test(tok.slice(0, -1).trim()));
}

/**
 * Indicate if the input AST contains an aggregate expression.
 * The string content of verbatim nodes is analyzed to try to identify
 * unparsed aggregate functions calls within SQL strings.
 * @param root The root of the AST to search.
 * @returns Return 0 if no aggregate functions are found.
 *  Sets bit 1 if an AggregateFunction instance is found.
 *  Sets bit 2 if an aggregate embedded in verbatim text is found.
 */
export function isAggregateExpression(root: SQLNode) {
  let agg = 0;
  walk(root, (node, parent) => {
    switch (node.type) {
      case AGGREGATE:
        if (parent?.type === WINDOW) break;
        agg |= 1;
        return -1;
      case FRAGMENT:
      case VERBATIM: {
        const s = stripSubqueries(`${node}`.toLowerCase());

        // exit if expression includes windowing
        if (windowRegExp.test(s)) return -1;
        if (hasVerbatimAggregate(s)) {
          agg |= 2;
          return -1;
        }
        return 1; // don't recurse
      }
      case SCALAR_SUBQUERY:
        return 1; // don't recurse
    }
  });
  return agg;
}

/**
 * Collect all aggregate function nodes.
 * @param root The root of the AST to search.
 */
export function collectAggregates(root: SQLNode) {
  const aggs = new Set<AggregateNode>();
  walk(root, (node, parent) => {
    if (node.type === AGGREGATE && parent?.type !== WINDOW) {
      aggs.add(node as AggregateNode);
    } else if (node.type === SCALAR_SUBQUERY) {
      return 1; // don't recurse
    }
  });
  return Array.from(aggs);
}

/**
 * Collect all unique column references.
 * Multiple references to the same column are de-duplicated, even if
 * they are not object-equal node instances.
 * COLUMNS expressions with a list of names contribute those columns;
 * regular expression and lambda selectors contribute a '*' column reference.
 * Positional references (#n) also contribute a '*' column reference.
 * Star expressions contribute themselves and any columns referenced by
 * REPLACE expressions, but not EXCLUDE or RENAME columns.
 * @param root The root of the AST to search.
 */
export function collectColumns(root: SQLNode) {
  const cols: Record<string, ColumnRefNode> = {};
  const visit = (node: SQLNode): number | void => {
    if (node instanceof StarNode) {
      cols[`${node}`] = node;
      node.replace.forEach(c => walk(c, visit));
      return 1;
    } else if (node.type === COLUMN_REF || node.type === COLUMN_PARAM) {
       // key on string-coerced node
      cols[`${node}`] = (node as ColumnRefNode);
    } else if (node.type === COLUMNS) {
      for (const ref of selectedColumns(node as ColumnsNode)) {
        cols[`${ref}`] = ref;
      }
    } else if (node.type === POSITIONAL_REF) {
      cols['*'] = new ColumnNameRefNode('*');
    }
  };
  walk(root, visit);
  return Object.values(cols);
}

function selectedColumns({ selector }: ColumnsNode): ColumnRefNode[] {
  if (selector.type === COLUMN_REF) return [];
  const names = selector.type === LIST
    ? (selector as ListNode).values.map(v => v.type === LITERAL ? (v as LiteralNode).value : null)
    : [];
  return names.length && names.every(name => typeof name === 'string')
    ? names.map(name => new ColumnNameRefNode(name as string))
    : [new ColumnNameRefNode('*')];
}

/**
 * Collect all unique dynamic parameter instances.
 * @param root The root of the AST to search.
 */
export function collectParams(root: SQLNode) {
  const params = new Set<ParamLike>;
  walk(root, (node) => {
    if (node.type === PARAM) {
      params.add((node as ParamNode).param);
    }
  });
  return Array.from(params);
}
