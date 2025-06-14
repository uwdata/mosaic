/**
 * @import { FrameExclude } from '../ast/window-frame.js'
 * @import { FrameExtent, FrameValue } from '../types.js'
 */
import { CURRENT_ROW, FOLLOWING, GROUPS, PRECEDING, RANGE, ROWS, WindowFrameExprNode, WindowFrameNode } from '../ast/window-frame.js';

/**
 * Return an updated window definition with the given rows frame.
 * @param {FrameExtent} extent The row-based window frame extent.
 * @param {FrameExclude} [exclude] The window frame exclusion criteria.
 * @returns {WindowFrameNode} A window frame node.
 */
export function frameRows(extent, exclude) {
  return new WindowFrameNode(ROWS, extent, exclude);
}

/**
 * Return an updated window definition with the given range frame.
 * @param {FrameExtent} extent The range-based window frame extent.
 * @param {FrameExclude} [exclude] The window frame exclusion criteria.
 * @returns {WindowFrameNode} A window frame node.
 */
export function frameRange(extent, exclude) {
  return new WindowFrameNode(RANGE, extent, exclude);
}

/**
 * Return an updated window definition with the given groups frame.
 * @param {FrameExtent} extent The group-based window frame extent.
 * @param {FrameExclude} [exclude] The window frame exclusion criteria.
 * @returns {WindowFrameNode} A window frame node.
 */
export function frameGroups(extent, exclude) {
  return new WindowFrameNode(GROUPS, extent, exclude);
}

/**
 * A `PRECEDING` frame value expression.
 * @param {FrameValue} value The frame value.
 * @returns {WindowFrameExprNode} A preceding value.
 */
export function preceding(value) {
  return new WindowFrameExprNode(PRECEDING, value);
}

/**
 * A `FOLLOWING` frame value expression.
 * @param {FrameValue} value  The frame value.
 * @returns {WindowFrameExprNode} A following value.
 */
export function following(value) {
  return new WindowFrameExprNode(FOLLOWING, value);
}

/**
 * A `CURRENT ROW` frame value expression.
 * @returns {WindowFrameExprNode} A current row value.
 */
export function currentRow() {
  return new WindowFrameExprNode(CURRENT_ROW);
}
