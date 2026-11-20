import { AllNode } from '../ast/all.js';

/**
 * Return a SQL AST node for the ALL keyword, for use with
 * GROUP BY ALL and ORDER BY ALL.
 */
export function all() {
  return new AllNode();
}
