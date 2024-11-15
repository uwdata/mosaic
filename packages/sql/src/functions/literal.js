import { LiteralNode } from '../ast/literal.js';
import { VerbatimNode } from '../ast/verbatim.js';

/**
 * Return a SQL AST node for a literal value. The supported types are
 * null, string, number, boolean, Date, and RegExp. Otherwise, the
 * input value will be directly coerced to a string.
 * @param {*} value The literal value.
 * @returns {LiteralNode}
 */
export function literal(value) {
  return new LiteralNode(value);
}

/**
 * Return a SQL AST node for verbatim string content.
 * @param {string} value The verbatim value.
 * @returns {VerbatimNode}
 */
export function verbatim(value) {
  return new VerbatimNode(value);
}
