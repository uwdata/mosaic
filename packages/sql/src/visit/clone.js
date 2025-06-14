import { isNode } from '../ast/node.js';
import { recurse } from './recurse.js';

/**
 * Create a deep clone of the given SQL AST node and all children nodes.
 * @template T
 * @param {T} node The node to deeply clone.
 * @returns {T} The cloned node.
 */
export function deepClone(node) {
  const clone = shallowClone(node);

  if (isNode(node)) {
    const props = recurse[node.type];
    const n = props?.length ?? 0;
    for (let i = 0; i < n; ++i) {
      const key = props[i];
      const value = node[key];
      clone[key] = Array.isArray(value)
        ? value.map(v => deepClone(v))
        : deepClone(value);
    }
  }

  return clone;
}

/**
 * Create a shallow clone of the given SQL AST node.
 * @template T
 * @param {T} node The node to clone.
 * @returns {T} The cloned node.
 */
function shallowClone(node) {
  /** @type {T} */
  let clone;

  if (!node || typeof node !== 'object') {
    return node;
  } else if (isNode(node)) {
    clone = node.clone();
  } else if (node instanceof Date) {
    // @ts-expect-error
    return new Date(+node);
  } else if (Array.isArray(node)) {
    // @ts-expect-error
    return node.slice();
  } else {
    return { ...node };
  }

  return clone;
}
