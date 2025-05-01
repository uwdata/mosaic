/**
 * @import { SQLNode } from '../ast/node.js'
 * @import { VisitorCallback, VisitorResult } from '../types.js'

 */
import { isNode } from '../ast/node.js';
import { recurse } from './recurse.js';

/**
 * Perform a traversal of a SQL expression AST.
 * @param {SQLNode} node Root node for AST traversal.
 * @param {VisitorCallback} visit Visitor callback function.
 * @return {VisitorResult}
 */
export function walk(node, visit) {
  if (!isNode(node)) return;
  const result = visit(node);
  if (result) return result;

  const props = recurse[node.type];
  const n = props?.length ?? 0;
  for (let i = 0; i < n; ++i) {
    const value = node[props[i]];
    if (Array.isArray(value)) {
      const m = value.length;
      for (let j = 0; j < m; ++j) {
        if (value[j] && +walk(value[j], visit) < 0) {
          return result;
        }
      }
    } else if (value && +walk(value, visit) < 0) {
      return -1;
    }
  }
}
