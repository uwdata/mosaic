import type { SQLNode } from '../ast/node.js';
import { isNode } from '../ast/node.js';
import { recurse } from './recurse.js';

/**
 * SQL AST traversal visitor callback result.
 * A falsy value (including `undefined`, `null`, `false`, and `0`) indicates
 * that traversal should continue.
 * A negative number values indicates that traversal should stop immediately.
 * Any other truthy value indicates that traversal should not recurse on the
 * current node, but should otherwise continue.
 */
export type VisitorResult = boolean | number | null | undefined | void;

/**
 * SQL AST traversal callback function.
 */
export type VisitorCallback = (node: SQLNode, parent?: SQLNode) => VisitorResult;

/**
 * Perform a traversal of a SQL expression AST.
 * @param node Root node for AST traversal.
 * @param visit Visitor callback function.
 */
export function walk(node: unknown, visit: VisitorCallback): VisitorResult {
  return _walk(node, undefined, visit);
}

/**
 * Perform a traversal of a SQL expression AST.
 * @param node Root node for AST traversal.
 * @param visit Visitor callback function.
 */
function _walk(node: unknown, parent: SQLNode | undefined, visit: VisitorCallback): VisitorResult {
  if (!isNode(node)) return;
  const result = visit(node, parent);
  if (result) return result;

  const props = recurse[node.type];
  const n = props?.length ?? 0;
  for (let i = 0; i < n; ++i) {
    // @ts-expect-error lookup of valid property
    const value = node[props[i]];
    if (Array.isArray(value)) {
      const m = value.length;
      for (let j = 0; j < m; ++j) {
        if (value[j] && Number(_walk(value[j], node, visit)) < 0) {
          return result;
        }
      }
    } else if (value && Number(_walk(value, node, visit)) < 0) {
      return -1;
    }
  }
}
