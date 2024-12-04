import { FunctionNode } from '../ast/function.js';
import { asLiteral } from '../util/ast.js';
import { argsList, fn } from '../util/function.js';

function strFn(name, expr, ...args) {
  return fn(name, expr, ...(argsList(args).map(asLiteral)));
}

/**
 * Function that returns true if a string contains a regexp pattern,
 * false otherwise.
 * @param {import('../types.js').ExprValue} string The string match against.
 * @param {import('../types.js').StringValue} pattern The regular expression pattern to match.
 * @param {import('../types.js').StringValue} [options] Regular expression options:
 *  'c': case-sensitive matching
 *  'i': case-insensitive matching
 *  'l': match literals instead of regular expression tokens
 *  'm', 'n', 'p': newline sensitive matching
 *  'g': global replace, only available for regexp_replace
 *  's': non-newline sensitive matching
 * @returns {FunctionNode}
 */
export function regexp_matches(string, pattern, options) {
  return strFn('regexp_matches', string, pattern, options);
}

/**
 * Function that returns true if search_string is found within string.
 * @param {import('../types.js').ExprValue} string The string to match against.
 * @param {import('../types.js').StringValue} search_string The substring to search for.
 * @returns {FunctionNode}
 */
export function contains(string, search_string) {
  return strFn('contains', string, search_string);
}

/**
 * Function that returns true if string begins with search_string.
 * @param {import('../types.js').ExprValue} string The string to match against.
 * @param {import('../types.js').StringValue} search_string The substring to search for.
 * @returns {FunctionNode}
 */
export function prefix(string, search_string) {
  return strFn('starts_with', string, search_string);
}

/**
 * Function that returns true if string ends with search_string.
 * @param {import('../types.js').ExprValue} string The string to match against.
 * @param {import('../types.js').StringValue} search_string The substring to search for.
 * @returns {FunctionNode}
 */
export function suffix(string, search_string) {
  return strFn('ends_with', string, search_string);
}

/**
 * Function that converts string to lower case.
 * @param {import('../types.js').ExprValue} string The string to convert.
 * @returns {FunctionNode}
 */
export function lower(string) {
  return strFn('lower', string);
}

/**
 * Function that converts string to upper case.
 * @param {import('../types.js').ExprValue} string The string to convert.
 * @returns {FunctionNode}
 */
export function upper(string) {
  return strFn('upper', string);
}

/**
 * Function that returns the number of characters in string.
 * @param {import('../types.js').ExprValue} value The string to measure.
 * @returns {FunctionNode}
 */
export function length(value) {
  return strFn('length', value);
}
