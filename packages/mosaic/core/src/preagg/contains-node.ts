import { walk } from '@uwdata/mosaic-sql';
import type { SQLNode } from '@uwdata/mosaic-sql';

/**
 * Test if an expression contains a node of a given type.
 * @param root The root node of the expression to test.
 * @param ctor The node class to search for.
 * @returns True if the expression contains a matching node.
 */
export function containsNode(
  root: SQLNode,
  ctor: new (...args: never[]) => SQLNode
): boolean {
  let found = false;
  walk(root, node => {
    if (node instanceof ctor) {
      found = true;
      return -1; // stop traversal
    }
  });
  return found;
}
