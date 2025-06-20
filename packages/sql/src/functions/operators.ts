import type { ExprValue, ExprVarArgs } from '../types.js';
import { BetweenOpNode, Extent, NotBetweenOpNode } from '../ast/between-op.js';
import { BinaryOpNode } from '../ast/binary-op.js';
import { InOpNode } from '../ast/in-op.js';
import { AndNode, OrNode } from '../ast/logical-op.js';
import { UnaryOpNode, UnaryPostfixOpNode } from '../ast/unary-op.js';
import { asNode } from '../util/ast.js';
import { nodeList } from '../util/function.js';

function unaryOp(op: string, expr: unknown) {
  return new UnaryOpNode(op, asNode(expr));
}

function unaryPostfixOp(op: string, expr: unknown) {
  return new UnaryPostfixOpNode(op, asNode(expr));
}

function binaryOp(op: string, left: unknown, right: unknown) {
  return new BinaryOpNode(op, asNode(left), asNode(right));
}

/**
 * Logical and (AND) operator.
 * @param clauses The input expressions.
 */
export function and(...clauses: ExprVarArgs[]) {
  return new AndNode(nodeList(clauses));
}

/**
 * Logical or (OR) operator.
 * @param clauses The input expressions.
 */
export function or(...clauses: ExprVarArgs[]) {
  return new OrNode(nodeList(clauses));
}

/**
 * Logical not (NOT) operator.
 * @param expr The expression to negate.
 */
export function not(expr: ExprValue) {
  return unaryOp('NOT', expr);
}

/**
 * Null check (IS NULL) operator.
 * @param expr The expression to test.
 */
export function isNull(expr: ExprValue) {
  return unaryPostfixOp('IS NULL', expr);
}

/**
 * Non-null check (IS NOT NULL) operator.
 * @param expr The expression to test.
 */
export function isNotNull(expr: ExprValue) {
  return unaryPostfixOp('IS NOT NULL', expr);
}

/**
 * Bitwise not (~) operator.
 * @param expr The input expression.
 */
export function bitNot(expr: ExprValue) {
  return unaryOp('~', expr);
}

/**
 * Bitwise and (&) operator.
 * @param left The left argument.
 * @param right The right argument.
 */
export function bitAnd(left: ExprValue, right: ExprValue) {
  return binaryOp('&', left, right);
}

/**
 * Bitwise or (|) operator.
 * @param left The left argument.
 * @param right The right argument.
 */
export function bitOr(left: ExprValue, right: ExprValue) {
  return binaryOp('|', left, right);
}

/**
 * Bit shift left (<<) operator.
 * @param left The left argument.
 * @param right The right argument.
 */
export function bitLeft(left: ExprValue, right: ExprValue) {
  return binaryOp('<<', left, right);
}

/**
 * Bit shift right (>>) operator.
 * @param left The left argument.
 * @param right The right argument.
 */
export function bitRight(left: ExprValue, right: ExprValue) {
  return binaryOp('>>', left, right);
}

/**
 * Addition (+) operator.
 * @param left The left argument.
 * @param right The right argument.
 */
export function add(left: ExprValue, right: ExprValue) {
  return binaryOp('+', left, right);
}

/**
 * Subtraction (-) operator.
 * @param left The left argument.
 * @param right The right argument.
 */
export function sub(left: ExprValue, right: ExprValue) {
  return binaryOp('-', left, right);
}

/**
 * Multiplication (*) operator.
 * @param left The left argument.
 * @param right The right argument.
 */
export function mul(left: ExprValue, right: ExprValue) {
  return binaryOp('*', left, right);
}

/**
 * Division (/) operator.
 * @param left The left argument.
 * @param right The right argument.
 */
export function div(left: ExprValue, right: ExprValue) {
  return binaryOp('/', left, right);
}

/**
 * Integer division (//) operator.
 * @param left The left argument.
 * @param right The right argument.
 */
export function idiv(left: ExprValue, right: ExprValue) {
  return binaryOp('//', left, right);
}

/**
 * Modulo (%) operator.
 * @param left The left argument.
 * @param right The right argument.
 */
export function mod(left: ExprValue, right: ExprValue) {
  return binaryOp('%', left, right);
}

/**
 * Exponentiation (**) operator.
 * @param left The left argument.
 * @param right The right argument.
 */
export function pow(left: ExprValue, right: ExprValue) {
  return binaryOp('**', left, right);
}

/**
 * Equality comparision (=) operator.
 * @param left The left argument.
 * @param right The right argument.
 */
export function eq(left: ExprValue, right: ExprValue) {
  return binaryOp('=', left, right);
}

/**
 * Non-equality comparision (<>) operator.
 * @param left The left argument.
 * @param right The right argument.
 */
export function neq(left: ExprValue, right: ExprValue) {
  return binaryOp('<>', left, right);
}

/**
 * Less-than comparision (<) operator.
 * @param left The left argument.
 * @param right The right argument.
 */
export function lt(left: ExprValue, right: ExprValue) {
  return binaryOp('<', left, right);
}

/**
 * Greater-than comparision (>) operator.
 * @param left The left argument.
 * @param right The right argument.
 */
export function gt(left: ExprValue, right: ExprValue) {
  return binaryOp('>', left, right);
}

/**
 * Less-than or equal comparision (<=) operator.
 * @param left The left argument.
 * @param right The right argument.
 */
export function lte(left: ExprValue, right: ExprValue) {
  return binaryOp('<=', left, right);
}

/**
 * Greater-than or equal comparision (>=) operator.
 * @param left The left argument.
 * @param right The right argument.
 */
export function gte(left: ExprValue, right: ExprValue) {
  return binaryOp('>=', left, right);
}

/**
 * Null-inclusive non-equality (IS DISTINCT FROM) operator.
 * @param left The left argument.
 * @param right The right argument.
 */
export function isDistinct(left: ExprValue, right: ExprValue) {
  return binaryOp('IS DISTINCT FROM', left, right);
}

/**
 * Null-inclusive equality (IS NOT DISTINCT FROM) operator.
 * @param left The left argument.
 * @param right The right argument.
 */
export function isNotDistinct(left: ExprValue, right: ExprValue) {
  return binaryOp('IS NOT DISTINCT FROM', left, right);
}

/**
 * Range inclusion (BETWEEN) operator.
 * @param expr The expression to test.
 * @param extent The range extent.
 */
export function isBetween(expr: ExprValue, extent?: ExprValue[] | null) {
  return new BetweenOpNode(
    asNode(expr),
    extent?.map(asNode) as (Extent | null | undefined)
  );
}

/**
 * Range exclusion (NOT BETWEEN) operator.
 * @param expr The expression to test.
 * @param extent The range extent.
 */
export function isNotBetween(expr: ExprValue, extent?: ExprValue[] | null) {
  return new NotBetweenOpNode(
    asNode(expr),
    extent?.map(asNode) as (Extent | null | undefined)
  );
}

/**
 * Set inclusion (IN) operator.
 * @param expr The expression to test.
 * @param values The included values.
 */
export function isIn(expr: ExprValue, values: ExprValue[]) {
  return new InOpNode(asNode(expr), values.map(asNode));
}
