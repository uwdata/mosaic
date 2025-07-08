import type { ExprValue } from "../types.js";
import { asNode } from "../util/ast.js";
import { UnnestNode } from "../ast/unnest.js";

/**
 * Create an Unnest Node to flatten nested structures, either structs or lists.
 * @param value
 * @param recursive
 * @param maxDepth
 */
export function unnest(value: ExprValue, recursive = false, maxDepth = 0) {
  return new UnnestNode(asNode(value), recursive, maxDepth);
}
