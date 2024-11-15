import { BetweenOpNode, NotBetweenOpNode } from '../ast/between-op.js';
import { BinaryOpNode } from '../ast/binary-op.js';
import { InOpNode } from '../ast/in-op.js';
import { AndNode, OrNode } from '../ast/logical-op.js';
import { UnaryOpNode, UnaryPosftixOpNode } from '../ast/unary-op.js';
import { asNode } from '../util/ast.js';
import { exprList } from '../util/function.js';

function unaryOp(op, expr) {
  return new UnaryOpNode(op, asNode(expr));
}

function unaryPostfixOp(op, expr) {
  return new UnaryPosftixOpNode(op, asNode(expr));
}

function binaryOp(op, left, right) {
  return new BinaryOpNode(op, asNode(left), asNode(right));
}

function betweenOp(expr, extent, negate = false) {
  const Op = negate ? NotBetweenOpNode : BetweenOpNode;
  return new Op(asNode(expr), extent?.map(asNode));
}

/**
 * Logical and (AND) operator.
 * @param {...import('../types.js').ExprVarArgs} clauses The input expressions.
 * @returns {AndNode}
 */
export function and(...clauses) {
  return new AndNode(exprList(clauses));
}

/**
 * Logical or (OR) operator.
 * @param {...import('../types.js').ExprVarArgs} clauses The input expressions.
 * @returns {OrNode}
 */
export function or(...clauses) {
  return new OrNode(exprList(clauses));
}

/**
 * Logical not (NOT) operator.
 * @param {import('../types.js').ExprValue} expr The expression to negate.
 * @returns {UnaryOpNode}
 */
export function not(expr) {
  return unaryOp('NOT', expr);
}

/**
 * Null check (IS NULL) operator.
 * @param {import('../types.js').ExprValue} expr The expression to test.
 * @returns {UnaryPosftixOpNode}
 */
export function isNull(expr) {
  return unaryPostfixOp('IS NULL', expr);
}

/**
 * Non-null check (IS NOT NULL) operator.
 * @param {import('../types.js').ExprValue} expr The expression to test.
 * @returns {UnaryPosftixOpNode}
 */
export function isNotNull(expr) {
  return unaryPostfixOp('IS NOT NULL', expr);
}

/**
 * Bitwise not (~) operator.
 * @param {import('../types.js').ExprValue} expr The input expression.
 * @returns {UnaryOpNode}
 */
export function bitNot(expr) {
  return unaryOp('~', expr);
}

/**
 * Bitwise and (&) operator.
 * @param {import('../types.js').ExprValue} left The left argument.
 * @param {import('../types.js').ExprValue} right The right argument.
 * @returns {BinaryOpNode}
 */
export function bitAnd(left, right) {
  return binaryOp('&', left, right);
}

/**
 * Bitwise or (|) operator.
 * @param {import('../types.js').ExprValue} left The left argument.
 * @param {import('../types.js').ExprValue} right The right argument.
 * @returns {BinaryOpNode}
 */
export function bitOr(left, right) {
  return binaryOp('|', left, right);
}

/**
 * Bit shift left (<<) operator.
 * @param {import('../types.js').ExprValue} left The left argument.
 * @param {import('../types.js').ExprValue} right The right argument.
 * @returns {BinaryOpNode}
 */
export function bitLeft(left, right) {
  return binaryOp('<<', left, right);
}

/**
 * Bit shift right (>>) operator.
 * @param {import('../types.js').ExprValue} left The left argument.
 * @param {import('../types.js').ExprValue} right The right argument.
 * @returns {BinaryOpNode}
 */
export function bitRight(left, right) {
  return binaryOp('>>', left, right);
}

/**
 * Addition (+) operator.
 * @param {import('../types.js').ExprValue} left The left argument.
 * @param {import('../types.js').ExprValue} right The right argument.
 * @returns {BinaryOpNode}
 */
export function add(left, right) {
  return binaryOp('+', left, right);
}

/**
 * Subtraction (-) operator.
 * @param {import('../types.js').ExprValue} left The left argument.
 * @param {import('../types.js').ExprValue} right The right argument.
 * @returns {BinaryOpNode}
 */
export function sub(left, right) {
  return binaryOp('-', left, right);
}

/**
 * Multiplication (*) operator.
 * @param {import('../types.js').ExprValue} left The left argument.
 * @param {import('../types.js').ExprValue} right The right argument.
 * @returns {BinaryOpNode}
 */
export function mul(left, right) {
  return binaryOp('*', left, right);
}

/**
 * Division (/) operator.
 * @param {import('../types.js').ExprValue} left The left argument.
 * @param {import('../types.js').ExprValue} right The right argument.
 * @returns {BinaryOpNode}
 */
export function div(left, right) {
  return binaryOp('/', left, right);
}

/**
 * Integer division (//) operator.
 * @param {import('../types.js').ExprValue} left The left argument.
 * @param {import('../types.js').ExprValue} right The right argument.
 * @returns {BinaryOpNode}
 */
export function idiv(left, right) {
  return binaryOp('//', left, right);
}

/**
 * Modulo (%) operator.
 * @param {import('../types.js').ExprValue} left The left argument.
 * @param {import('../types.js').ExprValue} right The right argument.
 * @returns {BinaryOpNode}
 */
export function mod(left, right) {
  return binaryOp('%', left, right);
}

/**
 * Exponentiation (**) operator.
 * @param {import('../types.js').ExprValue} left The left argument.
 * @param {import('../types.js').ExprValue} right The right argument.
 * @returns {BinaryOpNode}
 */
export function pow(left, right) {
  return binaryOp('**', left, right);
}

/**
 * Equality comparision (=) operator.
 * @param {import('../types.js').ExprValue} left The left argument.
 * @param {import('../types.js').ExprValue} right The right argument.
 * @returns {BinaryOpNode}
 */
export function eq(left, right) {
  return binaryOp('=', left, right);
}

/**
 * Non-equality comparision (<>) operator.
 * @param {import('../types.js').ExprValue} left The left argument.
 * @param {import('../types.js').ExprValue} right The right argument.
 * @returns {BinaryOpNode}
 */
export function neq(left, right) {
  return binaryOp('<>', left, right);
}

/**
 * Less-than comparision (<) operator.
 * @param {import('../types.js').ExprValue} left The left argument.
 * @param {import('../types.js').ExprValue} right The right argument.
 * @returns {BinaryOpNode}
 */
export function lt(left, right) {
  return binaryOp('<', left, right);
}

/**
 * Greater-than comparision (>) operator.
 * @param {import('../types.js').ExprValue} left The left argument.
 * @param {import('../types.js').ExprValue} right The right argument.
 * @returns {BinaryOpNode}
 */
export function gt(left, right) {
  return binaryOp('>', left, right);
}

/**
 * Less-than or equal comparision (<=) operator.
 * @param {import('../types.js').ExprValue} left The left argument.
 * @param {import('../types.js').ExprValue} right The right argument.
 * @returns {BinaryOpNode}
 */
export function lte(left, right) {
  return binaryOp('<=', left, right);
}

/**
 * Greater-than or equal comparision (>=) operator.
 * @param {import('../types.js').ExprValue} left The left argument.
 * @param {import('../types.js').ExprValue} right The right argument.
 * @returns {BinaryOpNode}
 */
export function gte(left, right) {
  return binaryOp('>=', left, right);
}

/**
 * Null-inclusive non-equality (IS DISTINCT FROM) operator.
 * @param {import('../types.js').ExprValue} left The left argument.
 * @param {import('../types.js').ExprValue} right The right argument.
 * @returns {BinaryOpNode}
 */
export function isDistinct(left, right) {
  return binaryOp('IS DISTINCT FROM', left, right);
}

/**
 * Null-inclusive equality (IS NOT DISTINCT FROM) operator.
 * @param {import('../types.js').ExprValue} left The left argument.
 * @param {import('../types.js').ExprValue} right The right argument.
 * @returns {BinaryOpNode}
 */
export function isNotDistinct(left, right) {
  return binaryOp('IS NOT DISTINCT FROM', left, right);
}

/**
 * Range inclusion (BETWEEN) operator.
 * @param {import('../types.js').ExprValue} expr The expression to test.
 * @param {import('../types.js').ExprValue[]} extent The range extent.
 * @returns {BetweenOpNode}
 */
export function isBetween(expr, extent) {
  return betweenOp(expr, extent, false);
}

/**
 * Range exclusion (NOT BETWEEN) operator.
 * @param {import('../types.js').ExprValue} expr The expression to test.
 * @param {import('../types.js').ExprValue[]} extent The range extent.
 * @returns {NotBetweenOpNode}
 */
export function isNotBetween(expr, extent) {
  return betweenOp(expr, extent, true);
}

/**
 * Set inclusion (IN) operator.
 * @param {import('../types.js').ExprValue} expr The expression to test.
 * @param {import('../types.js').ExprValue[]} values The included values.
 * @returns {InOpNode}
 */
export function isIn(expr, values) {
  return new InOpNode(asNode(expr), values.map(asNode));
}
