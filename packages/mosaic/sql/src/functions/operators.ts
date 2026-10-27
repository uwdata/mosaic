
import type { LiteralNode } from '../ast/literal.js';
import type { ExprNode } from '../ast/node.js';
import type { ExprValue, ExprVarArgs } from '../types.js';
import { LITERAL } from '../constants.js';
import { BetweenOpNode, Extent, NotBetweenOpNode } from '../ast/between-op.js';
import { BinaryOpNode } from '../ast/binary-op.js';
import { InOpNode } from '../ast/in-op.js';
import { type ComparisonOp, QuantifiedOpNode } from '../ast/quantified-op.js';
import type { Query } from '../ast/query.js';
import { ScalarSubqueryNode } from '../ast/subquery.js';
import { AndNode, OrNode } from '../ast/logical-op.js';
import { UnaryOpNode, UnaryPostfixOpNode } from '../ast/unary-op.js';
import { asNode } from '../util/ast.js';
import { nodeList } from '../util/function.js';
import { literal } from './literal.js';
import { TupleNode } from '../ast/tuple.js';

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
  return new InOpNode(asNode(expr), new TupleNode(values.map(asNode)));
}

function isNullLiteral(node: ExprNode) {
  return node.type === LITERAL && (node as LiteralNode).value == null;
}

/**
 * Null-safe set inclusion. Unlike the IN operator, the returned expression
 * can test for included NULL values. When a NULL literal is included in the
 * set values, it is checked explcity via `OR expr IS NULL`.
 *
 * The input expression may also be a tuple, in which case the values should
 * be tuples of the same length, as in `(a, b) IN ((1, 2), (3, 4))`. Value
 * tuples that contain NULL literals are instead tested explicitly via
 * `OR (a IS NULL AND b = 4)`.
 * @param expr The expression to test.
 * @param values The included values.
 */
export function isInDistinct(expr: ExprValue, values: ExprValue[]) {
  const test = asNode(expr);
  return test instanceof TupleNode
    ? isTupleInDistinct(test, values)
    : isValueInDistinct(test, values);
}

function isValueInDistinct(test: ExprNode, values: ExprValue[]) {
  const nodes = values.map(asNode)
    .filter(node => !isNullLiteral(node));
  const inOp = isIn(test, nodes);
  return values.length === 0 ? literal(false)
    : nodes.length === values.length ? inOp
    : nodes.length === 0 ? isNull(test)
    : or(inOp, isNull(test));
}

function isTupleInDistinct(test: TupleNode, values: ExprValue[]) {
  const fields = test.values;
  const tuples: TupleNode[] = [];
  const nullTuples: TupleNode[] = [];
  for (const value of values) {
    const node = asNode(value);
    if (!(node instanceof TupleNode) || node.values.length !== fields.length) {
      throw new Error(`Expected tuple value with ${fields.length} entries.`);
    }
    (node.values.some(isNullLiteral) ? nullTuples : tuples).push(node);
  }
  const clauses: ExprNode[] = nullTuples.map(t => and(fields.map((field, i) => {
    const v = t.values[i];
    return isNullLiteral(v) ? isNull(field) : eq(field, v);
  })));
  if (tuples.length) clauses.unshift(isIn(test, tuples));
  return clauses.length === 0 ? literal(false)
    : clauses.length === 1 ? clauses[0]
    : or(clauses);
}

/**
 * Comparison against any subquery row, as in `expr op ANY (subquery)`.
 * @param expr The expression to test.
 * @param op The comparison operator.
 * @param subquery A subquery returning a single column.
 */
export function compareAny(expr: ExprValue, op: ComparisonOp, subquery: Query) {
  return new QuantifiedOpNode(op, asNode(expr), 'ANY', new ScalarSubqueryNode(subquery));
}

/**
 * Comparison against all subquery rows, as in `expr op ALL (subquery)`.
 * @param expr The expression to test.
 * @param op The comparison operator.
 * @param subquery A subquery returning a single column.
 */
export function compareAll(expr: ExprValue, op: ComparisonOp, subquery: Query) {
  return new QuantifiedOpNode(op, asNode(expr), 'ALL', new ScalarSubqueryNode(subquery));
}
