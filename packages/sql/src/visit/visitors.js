import { AGGREGATE, COLUMN_PARAM, COLUMN_REF, FRAGMENT, PARAM, VERBATIM, WINDOW } from '../constants.js';
import { aggregateNames, AggregateNode } from '../ast/aggregate.js';
import { ColumnRefNode } from '../ast/column-ref.js';
import { SQLNode } from '../ast/node.js';
import { walk } from './walk.js';

// regexp to match valid aggregate function names
const aggrRegExp = new RegExp(`^(${aggregateNames.join('|')})$`);

// regexp to tokenize sql text in order to find function calls
// includes checks to avoid analyzing text within quoted strings
// function call tokens will have a pattern like "name(".
const funcRegExp = /(\\'|\\"|"(?:\\"|[^"])*"|'(?:\\'|[^'])*'|\w+\()/g;

function hasVerbatimAggregate(s) {
  return s
    .split(funcRegExp)
    .some(tok => tok.endsWith('(') && aggrRegExp.test(tok.slice(0, -1)));
}

/**
 * Indicate if the input AST contains an aggregate expression.
 * The string content of verbatim nodes is analyzed to try to identify
 * unparsed aggregate functions calls within SQL strings.
 * @param {SQLNode} root The root of the AST to search.
 * @returns {number} Return 0 if no aggregate functions are found.
 *  Sets bit 1 if an AggregateFunction instance is found.
 *  Sets bit 2 if an aggregate embedded in verbatim text is found.
 */
export function isAggregateExpression(root) {
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
 * @param {SQLNode} root The root of the AST to search.
 * @returns {AggregateNode[]}
 */
export function collectAggregates(root) {
  const aggs = new Set();
  walk(root, (node) => {
    if (node.type === AGGREGATE) {
      aggs.add(node);
    }
  });
  return Array.from(aggs);
}

/**
 * Collect all unique column references.
 * Multiple references to the same column are de-duplicated, even if
 * they are not object-equal node instances.
 * @param {SQLNode} root The root of the AST to search.
 * @returns {ColumnRefNode[]}
 */
export function collectColumns(root) {
  const cols = {};
  walk(root, (node) => {
    if (node.type === COLUMN_REF || node.type === COLUMN_PARAM) {
      cols[node] = node; // key on string-coerced node
    }
  });
  return Object.values(cols);
}

/**
 * Collect all unique dynamic parameter instances.
 * @param {SQLNode} root The root of the AST to search.
 * @returns {import('../types.js').ParamLike[]}
 */
export function collectParams(root) {
  const params = new Set;
  walk(root, (node) => {
    if (node.type === PARAM) {
      params.add(
        /** @type {import('../ast/param.js').ParamNode} */
        (node).param
      );
    }
  });
  return Array.from(params);
}
