import { PositionalRefNode } from '../ast/positional-ref.js';

/**
 * Create a positional column reference, as in `#1`.
 * @param index The 1-based column position.
 */
export function positionalRef(index: number) {
  return new PositionalRefNode(index);
}
