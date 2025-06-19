import { WINDOW_EXTENT_EXPR, WINDOW_FRAME } from '../constants.js';
import { type ParamLike } from '../types.js';
import { isParamLike } from '../util/type-check.js';
import { type ExprNode, isNode, SQLNode } from './node.js';
import { ParamNode } from './param.js';

export type FrameValue =  ExprNode | number | null;
export type FrameExtent = [FrameValue, FrameValue] | ParamLike;
export type FrameScope = 'PRECEDING' | 'FOLLOWING' | 'CURRENT ROW';
export type FrameType = 'ROWS' | 'RANGE' | 'GROUPS';
export type FrameExclude = 'NO OTHERS' | 'CURRENT ROW' | 'TIES' | 'GROUP';

export const ROWS = 'ROWS';
export const RANGE = 'RANGE';
export const GROUPS = 'GROUPS';
export const PRECEDING = 'PRECEDING';
export const FOLLOWING = 'FOLLOWING';
export const CURRENT_ROW = 'CURRENT ROW';
export const UNBOUNDED = 'UNBOUNDED';

export class WindowFrameNode extends SQLNode {
  /** The frame type, one of ROWS, RANGE, or GROUPS. */
  readonly frameType: FrameType;
  /** The window frame extent. */
  readonly extent: [unknown, unknown] | ParamNode;
  /** The window frame exclusion criteria. */
  readonly exclude?: FrameExclude;

  /**
   * Instantiate a window frame definition node.
   * @param frameType The frame type, one of ROWS, RANGE, or GROUPS.
   * @param extent The window frame extent.
   * @param exclude The window frame exclusion criteria.
   */
  constructor(
    frameType: FrameType,
    extent: FrameExtent,
    exclude?: FrameExclude
  ) {
    super(WINDOW_FRAME);
    this.frameType = frameType;
    this.extent = isParamLike(extent) ? new ParamNode(extent) : extent;
    this.exclude = exclude;
  }

  /**
   * Generate a SQL query string for this node.
   */
  toString() {
    const { frameType, exclude, extent } = this;
    const [prev, next] = isNode(extent)
      ? extent.value as [unknown, unknown]
      : extent;
    const a = asFrameExpr(prev, PRECEDING);
    const b = asFrameExpr(next, FOLLOWING);
    return `${frameType} BETWEEN ${a} AND ${b}${exclude ? ` ${exclude}` : ''}`;
  }
}

function asFrameExpr(value: unknown, scope: string) {
  return value instanceof WindowFrameExprNode ? value
    : value != null && typeof value !== 'number' ? `${value} ${scope}`
    : value === 0 ? CURRENT_ROW
    : !(value && Number.isFinite(value)) ? `${UNBOUNDED} ${scope}`
    : `${Math.abs(value)} ${scope}`;
}

export class WindowFrameExprNode extends SQLNode {
  /** The window frame extent. */
  readonly scope: FrameScope;
  /**
   * The window frame extent expression. This value should be null
   * in the case of current row or unbounded extent values.
   */
  readonly expr: FrameValue | null;

  /**
   * Instantiate a window frame definition node.
   * @param scope The frame scope, one of PRECEDING, FOLLOWING, or CURRENT ROW.
   * @param expr The window frame extent expression.
   */
  constructor(scope: FrameScope, expr: FrameValue | null = null) {
    super(WINDOW_EXTENT_EXPR);
    this.scope = scope;
    this.expr = expr;
  }

  /**
   * Generate a SQL query string for this node.
   */
  toString() {
    const { scope, expr } = this;
    return scope === CURRENT_ROW
      ? scope
      : `${expr ?? UNBOUNDED} ${scope}`;
  }
}
