import { isNode } from '../ast/node.js';
import { recurse } from './recurse.js';

/**
 * Create a deep clone of the given SQL AST node and all children nodes.
 * @param node The node to deeply clone.
 * @returns The cloned node.
 */
export function deepClone<T>(node: T): T {
  const clone = shallowClone(node);

  if (isNode(node)) {
    const props = recurse[node.type];
    const n = props?.length ?? 0;
    for (let i = 0; i < n; ++i) {
      const key = props[i];
      // @ts-expect-error allow assignment
      const value = node[key];
      // @ts-expect-error allow assignment
      clone[key] = Array.isArray(value)
        ? value.map(v => deepClone(v))
        : deepClone(value);
    }
  }

  return clone;
}

/**
 * Create a shallow clone of the given SQL AST node.
 * @param node The node to clone.
 * @returns The cloned node.
 */
function shallowClone<T>(node: T): T {
  /** @type {T} */
  let clone;

  if (!node || typeof node !== 'object') {
    return node;
  } else if (isNode(node)) {
    clone = node.clone();
  } else if (node instanceof Date) {
    // @ts-expect-error node is known to be Date
    return new Date(+node);
  } else if (Array.isArray(node)) {
    // @ts-expect-error allow slice
    return node.slice();
  } else {
    return { ...node };
  }

  return clone;
}
