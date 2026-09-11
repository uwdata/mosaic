import { TupleNode } from "../ast/tuple.js";
import { ValuesNode } from "../ast/values.js";
import type { ExprValue } from "../types.js";
import { asLiteral } from "../util/ast.js";

/**
 * Create a tuple AST node from a list of expression values.
 * If the input is already a tuple node, it is simply returned.
 * String expression values are treated as literals, not as column names.
 * @param values The included values.
 */
export function tuple(values: TupleNode | ExprValue[]) {
  return values instanceof TupleNode
    ? values
    : new TupleNode(values.map(asLiteral));
}

/**
 * Create a values AST node containing a list of tuples.
 * Input string values are treated as literals, NOT column names.
 * @param values The included values.
 */
export function values(values: (TupleNode | ExprValue[])[]) {
  return new ValuesNode(values.map(v => tuple(v)));
}
