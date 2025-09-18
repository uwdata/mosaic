import type { SampleClauseNode } from './sample.js';
import { JOIN_CLAUSE } from '../constants.js';
import { ColumnRefNode } from './column-ref.js';
import { FromNode } from './from.js';
import { ExprNode } from './node.js';
import { TableRefNode } from './table-ref.js';

/** The join variant. Determines what kind of join is performed. */
export type JoinVariant = 'REGULAR' | 'CROSS' | 'NATURAL' | 'POSITIONAL' | 'ASOF';

/** The join type. Determines which values are included in the join output. */
export type JoinType = 'INNER' | 'LEFT' | 'RIGHT' | 'FULL' | 'SEMI' | 'ANTI';

export class JoinNode extends FromNode {
  /** The left table to join. */
  readonly left: FromNode | TableRefNode;
  /** The right table to join. */
  readonly right: FromNode | TableRefNode;
  /** The join variant (REGULAR, CROSS, NATURAL, POSITIONAL, ASOF). */
  readonly joinVariant: JoinVariant;
  /** The join type (INNER, LEFT, RIGHT, FULL, SEMI, ANTI). */
  readonly joinType: JoinType;
  /**
   * The join condition as a boolean expression.
   * If specified, *using* should be `undefined`.
   */
  readonly condition?: ExprNode;
  /**
   * The join condition as shared columns to match on.
   * If specified, *condition* should be `undefined`.
   */
  readonly using?: ColumnRefNode[];
  /** A table sample to apply to join output. */
  readonly sample?: SampleClauseNode;

  /**
   * Instantiate a join node.
   * @param left The left table to join.
   * @param right The right table to join.
   * @param variant The join variant (REGULAR, CROSS, NATURAL, POSITIONAL, ASOF).
   * @param type The join type (INNER, LEFT, RIGHT, FULL, SEMI, ANTI).
   * @param condition The join condition as a boolean expression.
   *  If specified, *using* should be `undefined`.
   * @param using The join condition as shared columns to match on.
   *  If specified, *condition* should be `undefined`.
   * @param sample A table sample to apply to join output.
   */
  constructor(
    left: FromNode | TableRefNode,
    right: FromNode | TableRefNode,
    variant: JoinVariant = 'NATURAL',
    type: JoinType = 'INNER',
    condition?: ExprNode,
    using?: ColumnRefNode[],
    sample?: SampleClauseNode
  ) {
    super(JOIN_CLAUSE);
    this.left = left;
    this.right = right;
    this.joinVariant = variant;
    this.joinType = type;
    this.condition = condition;
    this.using = using;
    this.sample = sample;
  }

  /**
   * Generate a SQL query string for this node.
   */
  toString() {
    const { left, right, joinVariant, joinType, condition, using, sample } = this;
    const variant = joinVariant === 'REGULAR' ? '' : `${joinVariant} `;
    let type = '';
    let cond = '';

    if (joinVariant !== 'CROSS') {
      type = joinType !== 'INNER' ? `${joinType} ` : '';
      cond = condition ? ` ON ${condition}`
        : using ? ` USING (${using?.join(', ')})`
        : '';
    }
    const samp = sample ? ` USING SAMPLE ${sample}` : '';
    return `${left} ${variant}${type}JOIN ${right}${cond}${samp}`;
  }
}
