import type { ExprValue, NumberValue } from '../types.js';
import { winFn } from '../util/function.js';

/**
 * Create a window function that returns the number of the current row
 * within the partition, counting from 1.
 */
export function row_number() {
  return winFn('row_number');
}

/**
 * Create a window function that returns the rank of the current row with gaps.
 * This is the same as the row_number of its first peer.
 */
export function rank() {
  return winFn('rank');
}

/**
 * Create a window function that returns the rank of the current row without
 * gaps. The function counts peer groups.
 */
export function dense_rank() {
  return winFn('dense_rank');
}

/**
 * Create a window function that returns the relative rank of the current row.
 * Computed as (rank() - 1) / (total partition rows - 1).
 */
export function percent_rank() {
  return winFn('percent_rank');
}

/**
 * Create a window function that returns the cumulative distribution. Computed
 * as (number of preceding or peer partition rows) / total partition rows.
 */
export function cume_dist() {
  return winFn('cume_dist');
}

/**
 * Create a window function that returns an integer ranging from 1 to the
 * argument value, dividing the partition as equally as possible.
 * @param num_buckets The number of quantile buckets.
 */
export function ntile(num_buckets: NumberValue) {
  return winFn('ntile', num_buckets);
}

/**
 * Create a window function that returns the expression evaluated at the row
 * that is offset rows before the current row within the partition.
 * If there is no such row, instead return default (which must be of the same
 * type as the expression). Both offset and default are evaluated with respect
 * to the current row. If omitted, offset defaults to 1 and default to null.
 * @param expr The expression to evaluate.
 * @param offset The row offset (default `1`).
 * @param defaultValue The default value (default `null`).
 */
export function lag(expr: ExprValue, offset?: NumberValue, defaultValue?: unknown) {
  return winFn('lag', expr, offset, defaultValue);
}

/**
 * Create a window function that returns the expression evaluated at the row
 * that is offset rows after the current row within the partition.
 * If there is no such row, instead return default (which must be of the same
 * type as the expression). Both offset and default are evaluated with respect
 * to the current row. If omitted, offset defaults to 1 and default to null.
 * @param expr The expression to evaluate.
 * @param offset The row offset (default `1`).
 * @param defaultValue The default value (default `null`).
 */
export function lead(expr: ExprValue, offset?: NumberValue, defaultValue?: unknown) {
  return winFn('lead', expr, offset, defaultValue);
}

/**
 * Create a window function that returns the expression evaluated at the row
 * that is the first row of the window frame.
 * @param expr The expression to evaluate.
 */
export function first_value(expr: ExprValue) {
  return winFn('first_value', expr);
}

/**
 * Create a window function that returns the expression evaluated at the row
 * that is the last row of the window frame.
 * @param expr The expression to evaluate.
 */
export function last_value(expr: ExprValue) {
  return winFn('last_value', expr);
}

/**
 * Create a window function that returns the expression evaluated at the
 * nth row of the window frame (counting from 1), or null if no such row.
 * @param expr The expression to evaluate.
 * @param nth The 1-based window frame index.
 */
export function nth_value(expr: ExprValue, nth: NumberValue) {
  return winFn('nth_value', expr, nth);
}
