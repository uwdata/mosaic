import { ColumnRefNode } from '../ast/column-ref.js';
import { FromNode } from '../ast/from.js';
import { JoinNode, type JoinType, type JoinVariant } from '../ast/join.js';
import { ExprNode } from '../ast/node.js';
import { asNode, asTableRef } from '../util/ast.js';

type TableArg = string | string[] | FromNode;

/** Options for a JOIN operation. */
interface JoinOptions {
  /** The join type (INNER, LEFT, RIGHT, FULL, SEMI, ANTI). */
  type?: JoinType;
  /**
   * The join condition as a boolean expression.
   * If specified, the *using* option must not be specified.
   */
  on?: ExprNode;
  /**
   * The join condition as an array of columns to match.
   * The column names must exist in both tables.
   * If specified, the *on* option must not be specified.
   */
  using?: (string | ColumnRefNode)[];
}

function tableRef(x: TableArg) {
  return x instanceof FromNode ? x : asTableRef(x)!;
}

function makeJoin(
  left: TableArg,
  right: TableArg,
  variant?: JoinVariant,
  options: JoinOptions = {}
) {
  if (options.on && options.using) {
    throw new Error('Only one join condition (on or using) can be applied.');
  }
  return new JoinNode(
    tableRef(left),
    tableRef(right),
    variant,
    options.type,
    options.on,
    options.using?.map(c => asNode(c) as ColumnRefNode)
  );
}

/**
 * Create a new cross (cartesian product) join.
 * @param left The left table to join.
 * @param right The right table to join.
 */
export function cross_join(left: TableArg, right: TableArg) {
  return makeJoin(left, right, 'CROSS');
}

/**
 * Create a new POSITIONAL join.
 * @param left The left table to join.
 * @param right The right table to join.
 */
export function positional_join(left: TableArg, right: TableArg) {
  return makeJoin(left, right, 'POSITIONAL');
}

/**
 * Create a new join.
 * @param left The left table to join.
 * @param right The right table to join.
 * @param options The join options.
 */
export function join(
  left: TableArg,
  right: TableArg,
  options?: JoinOptions
) {
  return makeJoin(
    left,
    right,
    options?.on || options?.using ? 'REGULAR' : 'NATURAL',
    options
  );
}

/**
 * Create a new ASOF join.
 * @param left The left table to join.
 * @param right The right table to join.
 * @param options The join options.
 */
export function asof_join(
  left: TableArg,
  right: TableArg,
  options: JoinOptions
) {
  if (!(options.on || options.using)) {
    throw new Error('ASOF join requires a join condition.');
  }
  return makeJoin(left, right, 'ASOF', options);
}
