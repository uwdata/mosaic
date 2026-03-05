import type { ExprValue, StringValue } from '../types.js';
import { asLiteral } from '../util/ast.js';
import { argsList, fn } from '../util/function.js';

function strFn(name: string, expr: ExprValue, ...args: unknown[]) {
  return fn(name, expr, ...(argsList(args).map(asLiteral)));
}

/**
 * Function that returns true if a string contains a regexp pattern,
 * false otherwise.
 * @param string The string match against.
 * @param pattern The regular expression pattern to match.
 * @param options Regular expression options:
 *  'c': case-sensitive matching
 *  'i': case-insensitive matching
 *  'l': match literals instead of regular expression tokens
 *  'm', 'n', 'p': newline sensitive matching
 *  'g': global replace, only available for regexp_replace
 *  's': non-newline sensitive matching
 */
export function regexp_matches(
  string: ExprValue,
  pattern: StringValue,
  options?: StringValue
) {
  return strFn('regexp_matches', string, pattern, options);
}

/**
 * Function that returns true if search_string is found within string.
 * @param string The string to match against.
 * @param search_string The substring to search for.
 */
export function contains(string: ExprValue, search_string: StringValue) {
  return strFn('contains', string, search_string);
}

/**
 * Function that returns true if string begins with search_string.
 * @param string The string to match against.
 * @param search_string The substring to search for.
 */
export function prefix(string: ExprValue, search_string: StringValue) {
  return strFn('starts_with', string, search_string);
}

/**
 * Function that returns true if string ends with search_string.
 * @param string The string to match against.
 * @param search_string The substring to search for.
 */
export function suffix(string: ExprValue, search_string: StringValue) {
  return strFn('ends_with', string, search_string);
}

/**
 * Function that converts string to lower case.
 * @param string The string to convert.
 */
export function lower(string: ExprValue) {
  return strFn('lower', string);
}

/**
 * Function that converts string to upper case.
 * @param string The string to convert.
 */
export function upper(string: ExprValue) {
  return strFn('upper', string);
}

/**
 * Function that returns the number of characters in string.
 * @param value The string to measure.
 */
export function length(value: ExprValue) {
  return strFn('length', value);
}
