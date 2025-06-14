/**
 * @import { FrameExtent, FrameScope, FrameValue } from '../types.js'
 */
import { WINDOW_EXTENT_EXPR, WINDOW_FRAME } from '../constants.js';
import { isParamLike } from '../util/type-check.js';
import { isNode, SQLNode } from './node.js';
import { ParamNode } from './param.js';

/**
 * @typedef {ROWS | RANGE | GROUPS} FrameType
 * @typedef {'NO OTHERS' | 'CURRENT ROW' | 'TIES' | 'GROUP'} FrameExclude
 */

export const ROWS = 'ROWS';
export const RANGE = 'RANGE';
export const GROUPS = 'GROUPS';
export const PRECEDING = 'PRECEDING';
export const FOLLOWING = 'FOLLOWING';
export const CURRENT_ROW = 'CURRENT ROW';
export const UNBOUNDED = 'UNBOUNDED';

export class WindowFrameNode extends SQLNode {
  /**
   * Instantiate a window frame definition node.
   * @param {FrameType} frameType The frame type, one of ROWS, RANGE, or GROUPS.
   * @param {FrameExtent} extent The window frame extent.
   * @param {FrameExclude} [exclude] The window frame exclusion criteria.
   */
  constructor(frameType, extent, exclude = undefined) {
    super(WINDOW_FRAME);
    /**
     * The frame type, one of ROWS, RANGE, or GROUPS.
     * @type {FrameType}
     * @readonly
     */
    this.frameType = frameType;
    /**
     * The window frame extent.
     * @type {[any, any] | ParamNode}
     * @readonly
     */
    this.extent = isParamLike(extent) ? new ParamNode(extent) : extent;
    /**
     * The window frame exclusion criteria.
     * @type {FrameExclude}
     * @readonly
     */
    this.exclude = exclude;
  }

  /**
   * Generate a SQL query string for this node.
   * @returns {string}
   */
  toString() {
    const { frameType, exclude, extent } = this;
    const [prev, next] = isNode(extent) ? extent.value : extent;
    const a = asFrameExpr(prev, PRECEDING);
    const b = asFrameExpr(next, FOLLOWING);
    return `${frameType} BETWEEN ${a} AND ${b}${exclude ? ` ${exclude}` : ''}`;
  }
}

function asFrameExpr(value, scope) {
  return value instanceof WindowFrameExprNode ? value
    : value != null && typeof value !== 'number' ? `${value} ${scope}`
    : value === 0 ? CURRENT_ROW
    : !(value && Number.isFinite(value)) ? `${UNBOUNDED} ${scope}`
    : `${Math.abs(value)} ${scope}`;
}

export class WindowFrameExprNode extends SQLNode {
  /**
   * Instantiate a window frame definition node.
   * @param {FrameScope} scope The frame scope, one of PRECEDING, FOLLOWING, or CURRENT ROW.
   * @param {FrameValue | null} [expr] The window frame extent expression.
   */
  constructor(scope, expr = null) {
    super(WINDOW_EXTENT_EXPR);

    /**
     * The window frame extent.
     * @type {FrameScope}
     * @readonly
     */
    this.scope = scope;

    /**
     * The window frame extent expression. This value should be null
     * in the case of current row or unbounded extent values.
     * @type {FrameValue | null}
     * @readonly
     */
    this.expr = expr;
  }

  /**
   * Generate a SQL query string for this node.
   * @returns {string}
   */
  toString() {
    const { scope, expr } = this;
    return scope === CURRENT_ROW
      ? scope
      : `${expr ?? UNBOUNDED} ${scope}`;
  }
}
