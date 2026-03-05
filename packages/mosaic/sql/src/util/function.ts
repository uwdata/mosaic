import type { ExprNode, SQLNode } from '../ast/node.js';
import type { WindowFunctionName } from '../types.js';
import { AggregateNode } from '../ast/aggregate.js';
import { FunctionNode } from '../ast/function.js';
import { WindowFunctionNode, WindowNode } from '../ast/window.js';
import { asNode } from './ast.js';

/**
 * Test if an AST node is a specific function call.
 * @param node The SQL AST node to test.
 * @param name The function name.
 */
export function isFunctionCall(
  node: SQLNode,
  name: string
): node is FunctionNode {
  return node instanceof FunctionNode && node.name === name;
}

/**
 * Create a new function call AST node.
 * @param name The function name.
 * @param args The function arguments.
 */
export function fn(name: string, ...args: unknown[]): FunctionNode {
  return new FunctionNode(name, argsList(args).map(asNode));
}

/**
 * Create a new aggregate function AST node.
 * @param name The function name.
 * @param args The function arguments.
 */
export function aggFn(name: string, ...args: unknown[]): AggregateNode {
  return new AggregateNode(name, argsList(args).map(asNode));
}

/**
 * Create a new window AST node. The output node has an empty window
 * definition. Use chained calls such as `partitionby` and `orderby`
 * to specify the window settings.
 * @param name The function name.
 * @param args The function arguments.
 */
export function winFn(
  name: WindowFunctionName,
  ...args: unknown[]
): WindowNode {
  return new WindowNode(
    new WindowFunctionNode(name, argsList(args).map(asNode))
  );
}

/**
 * Process a list of expression inputs. Nested arrays are flattened,
 * null results are removed, and each input is cast to a SQL AST node.
 * @param list The list of expression inputs.
 * @param cast A function that casts an input value
 *  to a desired type. By default, `asNode` is used to coerce
 *  inputs to AST nodes as needed.
 */
export function exprList<T>(
  list: unknown[],
  cast: ((x: unknown) => T)
): T[] {
  return list.flat().filter(x => x != null).map(x => cast(x));
}

/**
 * Process a list of expression inputs. Nested arrays are flattened,
 * null results are removed, and each input is cast (as needed) to
 * be a proper SQL AST node. By default, strings are assumed to be
 * column names, while other primitive values map to SQL literals.
 * Use an alternative *cast* function to change this behavior.
 * @param list The list of expression inputs.
 */
export function nodeList(list: unknown[]): ExprNode[] {
  return exprList(list, asNode);
}

/**
 * Process a list of function arguments, stripping any undefined
 * values from the end of the list.
 * @param list The input function arguments.
 */
export function argsList<T>(list: T[]): T[] {
  const n = list.length;
  let i = n;
  for (; i > 0 && list[i - 1] === undefined; --i);
  return i < n ? list.slice(0, i) : list;
}
