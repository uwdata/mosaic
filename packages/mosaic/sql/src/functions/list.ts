import type { ExprValue } from "../types.js";
import { asLiteral, asNode } from "../util/ast.js";
import { argsList, fn } from "../util/function.js";
import { ListNode } from "../ast/list.js";
import { literal } from "./literal.js";

/**
 * Create a List containing the argument values.
 * @param values
 */
export function list(...values: ExprValue[]) {
  return new ListNode(argsList(values).map(asLiteral));
}

/**
 * Convert a single value or an array of values to either a ListNode if the input
 * is an array, or a single ExprNode if it is a single value. A single string will
 * be interpreted as a column reference.
 * @param values
 */
function exprValuesToExprNode(values: ExprValue | ExprValue[]) {
  return Array.isArray(values) ? list(...values) : asNode(values);
}

/**
 * Function that returns true if the list contains the element,
 * false otherwise. If the first argument is a string, it is
 * interpreted as a column reference, otherwise it is coerced
 * to a list.
 * @param list1
 * @param element
 */
export function listContains(
  list1: ExprValue | ExprValue[],
  element: ExprValue,
) {
  return fn("list_contains", exprValuesToExprNode(list1), literal(element));
}

/**
 * Function that returns true if all elements of list2 exist in list1,
 * false otherwise.
 * @param list1
 * @param list2
 */
export function listHasAll(
  list1: ExprValue | ExprValue[],
  list2: ExprValue | ExprValue[],
) {
  return fn(
    "list_has_all",
    exprValuesToExprNode(list1),
    exprValuesToExprNode(list2),
  );
}

/**
 * Function that returns true if any elements exist in both lists,
 * false otherwise.
 * @param list1
 * @param list2
 */
export function listHasAny(
  list1: ExprValue | ExprValue[],
  list2: ExprValue | ExprValue[],
) {
  return fn(
    "list_has_any",
    exprValuesToExprNode(list1),
    exprValuesToExprNode(list2),
  );
}
