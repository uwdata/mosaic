import type { ExprValue } from "../types.js";
import { asLiteral, asNode } from "../util/ast.js";
import { argsList, fn } from "../util/function.js";
import { ListNode } from "../ast/list.js";

/**
 * Create a List containing the argument values.
 * @param values
 */
export function list(values: ExprValue[]) {
  return new ListNode(argsList(values).map(asLiteral));
}

/**
 * Convert a single value or an array of values to either a ListNode if the input
 * is an array, or a single ExprNode if it is a single value. A single string will
 * be interpreted as a column reference.
 * @param values
 */
function asList(values: ExprValue | ExprValue[]) {
  return Array.isArray(values) ? list(values) : asNode(values);
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
  switch (this.dialect) {
    case "clickhouse":
      return fn("has", asList(list1), asLiteral(element));
    case "starrocks":
      return fn("array_contains", asList(list1), asLiteral(element));
    case "bigquery":
      return "element IN UNNEST(list1)";
    default:
      return fn("list_contains", asList(list1), asLiteral(element));
  }
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
  switch (this.dialect) {
    case "clickhouse":
      return fn("hasAll", asList(list1), asList(list2));
    case "starrocks":
      return fn("array_contains_all", asList(list1), asList(list2));
    case "bigquery":
      return "(SELECT COUNT(l2) = ARRAY_LENGTH(list2) FROM UNNEST(list1) AS l1 JOIN UNNEST(list1) AS l2 ON l1 = l2)";
    default:
      return fn("list_has_all", asList(list1), asList(list2));
  }
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
  switch (this.dialect) {
    case "clickhouse":
      return fn("hasAny", asList(list1), asList(list2));
    case "starrocks":
      return fn("arrays_overlap", asList(list1), asList(list2));
    case "bigquery":
      return "EXISTS(SELECT * FROM UNNEST(list1) AS l1 WHERE l1 IN UNNEST(list2))";
    default:
      return fn("list_has_any", asList(list1), asList(list2));
  }
}
