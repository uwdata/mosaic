import { type AggregateNode, aggregateNames } from '../ast/aggregate.js';
import type { ColumnRefNode } from '../ast/column-ref.js';
import type { SQLNode } from '../ast/node.js';
import type { ParamNode } from '../ast/param.js';
import type { ParamLike } from '../types.js';
import { AGGREGATE, COLUMN_PARAM, COLUMN_REF, FRAGMENT, PARAM, VERBATIM, WINDOW } from '../constants.js';
import { walk } from './walk.js';

// regexp to match valid aggregate function names
const aggrRegExp = new RegExp(`^(${aggregateNames.join('|')})$`);

// regexp to tokenize sql text in order to find function calls
// includes checks to avoid analyzing text within quoted strings
// function call tokens will have a pattern like "name(".
const funcRegExp = /(\\'|\\"|"(?:\\"|[^"])*"|'(?:\\'|[^'])*'|\w+\()/g;

function hasVerbatimAggregate(s: string) {
  return s
    .split(funcRegExp)
    .some(tok => tok.endsWith('(') && aggrRegExp.test(tok.slice(0, -1)));
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
  walk(root, (node) => {
    switch (node.type) {
      case WINDOW:
        return -1; // aggs can't include windows
      case AGGREGATE:
        agg |= 1;
        return -1;
      case FRAGMENT:
      case VERBATIM: {
        let s = `${node}`.toLowerCase();

        // strip away scalar subquery content
        const sub = s.indexOf('(select ');
        if (sub >= 0) s = s.slice(0, sub);

        // exit if expression includes windowing
        if (s.includes(') over ')) return -1;
        if (hasVerbatimAggregate(s)) {
          agg |= 2;
          return -1;
        }
        return 1; // don't recurse
      }
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
  walk(root, (node) => {
    if (node.type === AGGREGATE) {
      aggs.add(node as AggregateNode);
    }
  });
  return Array.from(aggs);
}

/**
 * Collect all unique column references.
 * Multiple references to the same column are de-duplicated, even if
 * they are not object-equal node instances.
 * @param root The root of the AST to search.
 */
export function collectColumns(root: SQLNode) {
  const cols: Record<string, ColumnRefNode> = {};
  walk(root, (node) => {
    if (node.type === COLUMN_REF || node.type === COLUMN_PARAM) {
       // key on string-coerced node
      cols[`${node}`] = (node as ColumnRefNode);
    }
  });
  return Object.values(cols);
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
