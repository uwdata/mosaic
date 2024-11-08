import { AggregateNode } from '../ast/aggregate.js';
import { FunctionNode } from '../ast/function.js';
import { WindowFunctionNode, WindowNode } from '../ast/window.js';
import { asNode } from './ast.js';

/**
 * Test if an AST node is a specific function call.
 * @param {import('../ast/node.js').SQLNode} node The SQL AST node to test.
 * @param {string} name The function name.
 * @returns {node is FunctionNode}
 */
export function isFunctionCall(node, name) {
  return node instanceof FunctionNode && node.name === name;
}

/**
 * Create a new function call AST node.
 * @param {string} name The function name.
 * @param  {...any} args The function arguments.
 * @returns {FunctionNode}
 */
export function fn(name, ...args) {
  return new FunctionNode(name, argsList(args).map(asNode));
}

/**
 * Create a new aggregate function AST node.
 * @param {string} name The function name.
 * @param  {...any} args The function arguments.
 * @returns {AggregateNode}
 */
export function aggFn(name, ...args) {
  return new AggregateNode(name, argsList(args).map(asNode));
}

/**
 * Create a new window AST node. The output node has an empty window
 * definition. Use chained calls such as `partitionby` and `orderby`
 * to specify the window settings.
 * @param {import('../types.js').WindowFunctionName} name The function name.
 * @param  {...any} args The function arguments.
 * @returns {WindowNode}
 */
export function winFn(name, ...args) {
  return new WindowNode(
    new WindowFunctionNode(name, argsList(args).map(asNode))
  );
}

/**
 * Process a list of expression inputs. Nested arrays are flattened,
 * null results are removed, and each input is cast (as needed) to
 * be a proper SQL AST node. By default, strings are assumed to be
 * column names, while other primitive values map to SQL literals.
 * Use an alternative *cast* function to change this behavior.
 * @param {any[]} list The list of expression inputs.
 * @param {function} [cast] A function that casts an input value
 *  to a desired type. By default, `asNode` is used to coerce
 *  inputs to AST nodes as needed.
 * @returns {ReturnType<cast>[]}
 */
export function exprList(list, cast = asNode) {
  return list.flat().filter(x => x != null).map(x => cast(x));
}

/**
 * Process a list of function arguments, stripping any undefined
 * values from the end of the list.
 * @template T
 * @param {T[]} list The input function arguments.
 * @returns {T[]} The prepared argument list.
 */
export function argsList(list) {
  const n = list.length;
  let i = n;
  for (; i > 0 && list[i - 1] === undefined; --i);
  return i < n ? list.slice(0, i) : list;
}
