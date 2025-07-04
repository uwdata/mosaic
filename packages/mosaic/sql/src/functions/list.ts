import type {ExprValue, MaybeArray} from '../types.js';
import { asLiteral } from '../util/ast.js';
import { argsList, fn } from '../util/function.js';
import { ListNode } from "../ast/list.js";
import {ExprNode} from "../ast/node";

function listFn(name: string, expr: MaybeArray<ExprValue>, ...args: unknown[]) {
  return fn(name, expr, ...(argsList(args).map(asLiteral)));
}

/**
 * Return a SQL AST node for a literal value. The supported types are
 * null, string, number, boolean, Date, and RegExp. Otherwise, the
 * input value will be directly coerced to a string.
 * @param values
 */
export function list(values: ExprNode) {
  return new ListNode(values);
}

/**
 * Function that returns true if the list contains the element,
 * false otherwise.
 * @param list
 * @param element
 */
export function list_contains(
  list: MaybeArray<ExprValue>,
  element: ExprValue
) {
  return listFn('list_contains', list, element);
}

/**
 * Function that returns true if all elements of sub-list exist in list,
 * false otherwise.
 * @param list
 * @param sub_list
 */
export function list_has_all(
  list: MaybeArray<ExprValue>,
  sub_list: ExprValue[]
) {
  return listFn('list_has_all', list, sub_list);
}

/**
 * Function that returns true if any elements exist in both lists,
 * false otherwise.
 * @param list1
 * @param list2
 */
export function list_has_any(
  list1: MaybeArray<ExprValue>,
  list2: ExprValue[]
) {
  return listFn('list_has_any', list1, list2);
}
