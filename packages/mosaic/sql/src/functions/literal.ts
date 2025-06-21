import { LiteralNode } from '../ast/literal.js';
import { VerbatimNode } from '../ast/verbatim.js';

/**
 * Return a SQL AST node for a literal value. The supported types are
 * null, string, number, boolean, Date, and RegExp. Otherwise, the
 * input value will be directly coerced to a string.
 * @param value The literal value.
 */
export function literal(value: unknown) {
  return new LiteralNode(value);
}

/**
 * Return a SQL AST node for verbatim string content.
 * @param value The verbatim value.
 * @param hint A type hint for analyzing verbatim content.
 */
export function verbatim(value: string, hint?: string) {
  return new VerbatimNode(value, hint);
}
