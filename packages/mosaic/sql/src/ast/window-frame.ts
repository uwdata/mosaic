import type { CURRENT_ROW, FOLLOWING, GROUPS, PRECEDING, RANGE, ROWS } from '../constants.js';
import { WINDOW_EXTENT_EXPR, WINDOW_FRAME } from '../constants.js';
import { type ParamLike } from '../types.js';
import { isParamLike } from '../util/type-check.js';
import { type ExprNode, SQLNode } from './node.js';
import { ParamNode } from './param.js';

export type FrameValue =  ExprNode | number | null;
export type FrameExtent = [FrameValue, FrameValue] | ParamLike;
export type FrameScope = typeof PRECEDING | typeof FOLLOWING | typeof CURRENT_ROW;
export type FrameType = typeof ROWS | typeof RANGE | typeof GROUPS;
export type FrameExclude = 'NO OTHERS' | 'CURRENT ROW' | 'TIES' | 'GROUP';

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
}
