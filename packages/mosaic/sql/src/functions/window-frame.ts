import type { FrameExclude, FrameExtent, FrameValue } from '../ast/window-frame.js';
import { CURRENT_ROW, FOLLOWING, GROUPS, PRECEDING, RANGE, ROWS, WindowFrameExprNode, WindowFrameNode } from '../ast/window-frame.js';

/**
 * Return an updated window definition with the given rows frame.
 * @param extent The row-based window frame extent.
 * @param exclude The window frame exclusion criteria.
 * @returns A window frame node.
 */
export function frameRows(extent: FrameExtent, exclude?: FrameExclude) {
  return new WindowFrameNode(ROWS, extent, exclude);
}

/**
 * Return an updated window definition with the given range frame.
 * @param extent The range-based window frame extent.
 * @param exclude The window frame exclusion criteria.
 * @returns A window frame node.
 */
export function frameRange(extent: FrameExtent, exclude?: FrameExclude) {
  return new WindowFrameNode(RANGE, extent, exclude);
}

/**
 * Return an updated window definition with the given groups frame.
 * @param extent The group-based window frame extent.
 * @param exclude The window frame exclusion criteria.
 * @returns A window frame node.
 */
export function frameGroups(extent: FrameExtent, exclude?: FrameExclude) {
  return new WindowFrameNode(GROUPS, extent, exclude);
}

/**
 * A `PRECEDING` frame value expression.
 * @param value The frame value.
 * @returns A preceding value.
 */
export function preceding(value: FrameValue) {
  return new WindowFrameExprNode(PRECEDING, value);
}

/**
 * A `FOLLOWING` frame value expression.
 * @param value  The frame value.
 * @returns A following value.
 */
export function following(value: FrameValue) {
  return new WindowFrameExprNode(FOLLOWING, value);
}

/**
 * A `CURRENT ROW` frame value expression.
 * @returns A current row value.
 */
export function currentRow() {
  return new WindowFrameExprNode(CURRENT_ROW);
}
