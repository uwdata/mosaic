import { type ExprNode, isNode } from '../ast/node.js';
import { recurse } from './recurse.js';

/**
 * Rewrite a SQL expression, based on a map of nodes to replace.
 * This method copies nodes as needed; it does not modify the input node.
 * @param node The root AST node of the expression.
 * @param map The rewrite map. When encountered, key nodes are replaced by value nodes.
 */
export function rewrite(node: ExprNode, map: Map<ExprNode, ExprNode>) {
  if (map.has(node)) {
    return map.get(node);
  } else if (isNode(node)) {
    const props = recurse[node.type];
    const n = props?.length ?? 0;
    if (n > 0) {
      node = node.clone();
      for (let i = 0; i < n; ++i) {
        const prop = props[i];
        // @ts-expect-error
        const child = node[prop];
        if (Array.isArray(child)) {
          // @ts-expect-error
          const a = (node[prop] = child.slice());
          const m = child.length;
          for (let j = 0; j < m; ++j) {
            a[j] = rewrite(child[j], map);
          }
        } else if (child) {
          // @ts-expect-error
          node[prop] = rewrite(child, map);
        }
      }
    }
  }
  return node;
}
