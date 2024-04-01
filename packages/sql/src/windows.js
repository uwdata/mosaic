import { SQLExpression, isParamLike, sql } from './expression.js';
import { functionCall } from './functions.js';
import { asColumn } from './ref.js';
import { repeat } from './repeat.js';

/**
 * Base class for individual window functions.
 * Most callers should use a dedicated window function
 * rather than instantiate this class.
 */
export class WindowFunction extends SQLExpression {
  /**
   * Create a new WindowFunction instance.
   * @param {string} op The window operation indicator.
   * @param {*} func The window function expression.
   * @param {*} [type] The SQL data type to cast to.
   * @param {string} [name] The window definition name.
   * @param {*} [group] Grouping (partition by) expressions.
   * @param {*} [order] Sorting (order by) expressions.
   * @param {*} [frame] The window frame definition.
   */
  constructor(op, func, type, name, group = '', order = '', frame = '') {
    // build and parse expression
    let expr;
    const noWindowParams = !(group || order || frame);
    if (name && noWindowParams) {
      expr = name ? sql`${func} OVER "${name}"` : sql`${func} OVER ()`;
    } else {
      const s1 = group && order ? ' ' : '';
      const s2 = (group || order) && frame ? ' ' : '';
      expr = sql`${func} OVER (${name ? `"${name}" ` : ''}${group}${s1}${order}${s2}${frame})`;
    }
    if (type) {
      expr = sql`(${expr})::${type}`;
    }
    const { _expr, _deps } = expr;
    super(_expr, _deps);
    this.window = op;
    this.func = func;
    this.type = type;
    this.name = name;
    this.group = group;
    this.order = order;
    this.frame = frame;
  }

  get basis() {
    return this.column;
  }

  get label() {
    const { func } = this;
    return func.label ?? func.toString();
  }

  /**
   * Return an updated window function over a named window definition.
   * @param {string} name The window definition name.
   * @returns {WindowFunction} A new window function.
   */
  over(name) {
    const { window: op, func, type, group, order, frame } = this;
    return new WindowFunction(op, func, type, name, group, order, frame);
  }

  /**
   * Return an updated window function with the given partitioning.
   * @param {*} expr The grouping (partition by) criteria for the window function.
   * @returns {WindowFunction} A new window function.
   */
  partitionby(...expr) {
    const exprs = expr.flat().filter(x => x).map(asColumn);
    const group = sql(
      ['PARTITION BY ', repeat(exprs.length - 1, ', '), ''],
      ...exprs
    );
    const { window: op, func, type, name, order, frame } = this;
    return new WindowFunction(op, func, type, name, group, order, frame);
  }

  /**
   * Return an updated window function with the given ordering.
   * @param {*} expr The sorting (order by) criteria for the window function.
   * @returns {WindowFunction} A new window function.
   */
  orderby(...expr) {
    const exprs = expr.flat().filter(x => x).map(asColumn);
    const order = sql(
      ['ORDER BY ', repeat(exprs.length - 1, ', '), ''],
      ...exprs
    );
    const { window: op, func, type, name, group, frame } = this;
    return new WindowFunction(op, func, type, name, group, order, frame);
  }

  /**
   * Return an updated window function with the given rows frame.
   * @param {(number|null)[] | import('./expression.js').ParamLike} expr The row-based window frame.
   * @returns {WindowFunction} A new window function.
   */
  rows(expr) {
    const frame = windowFrame('ROWS', expr);
    const { window: op, func, type, name, group, order } = this;
    return new WindowFunction(op, func, type, name, group, order, frame);
  }

  /**
   * Return an updated window function with the given range frame.
   * @param {(number|null)[] | import('./expression.js').ParamLike} expr The range-based window frame.
   * @returns {WindowFunction} A new window function.
   */
  range(expr) {
    const frame = windowFrame('RANGE', expr);
    const { window: op, func, type, name, group, order } = this;
    return new WindowFunction(op, func, type, name, group, order, frame);
  }
}

function windowFrame(type, frame) {
  if (isParamLike(frame)) {
    const expr = sql`${frame}`;
    expr.toString = () => `${type} ${frameToSQL(frame.value)}`;
    return expr;
  }
  return `${type} ${frameToSQL(frame)}`;
}

function frameToSQL(frame) {
  const [prev, next] = frame;
  const a = prev === 0 ? 'CURRENT ROW'
    : Number.isFinite(prev) ? `${Math.abs(prev)} PRECEDING`
    : 'UNBOUNDED PRECEDING';
  const b = next === 0 ? 'CURRENT ROW'
    : Number.isFinite(next) ? `${Math.abs(next)} FOLLOWING`
    : 'UNBOUNDED FOLLOWING';
  return `BETWEEN ${a} AND ${b}`;
}

export function winf(op, type) {
  return (...values) => {
    const func = functionCall(op)(...values);
    return new WindowFunction(op, func, type);
  };
}

/**
 * Create a window function that returns the number of the current row
 * within the partition, counting from 1.
 * @returns {WindowFunction} The generated window function.
 */
export const row_number = winf('ROW_NUMBER', 'INTEGER');

/**
 * Create a window function that returns the rank of the current row with gaps.
 * This is the same as the row_number of its first peer.
 * @returns {WindowFunction} The generated window function.
 */
export const rank = winf('RANK', 'INTEGER');

/**
 * Create a window function that returns the rank of the current row without gaps,
 * The function counts peer groups.
 * @returns {WindowFunction} The generated window function.
 */
export const dense_rank = winf('DENSE_RANK', 'INTEGER');

/**
 * Create a window function that returns the relative rank of the current row.
 * (rank() - 1) / (total partition rows - 1).
 * @returns {WindowFunction} The generated window function.
 */
export const percent_rank = winf('PERCENT_RANK');

/**
 * Create a window function that returns the cumulative distribution.
 * (number of preceding or peer partition rows) / total partition rows.
 * @returns {WindowFunction} The generated window function.
 */
export const cume_dist = winf('CUME_DIST');

/**
 * Create a window function that r an integer ranging from 1 to the argument
 * value, dividing the partition as equally as possible.
 * @param {number|SQLExpression} num_buckets The number of quantile buckets.
 * @returns {WindowFunction} The generated window function.
 */
export const ntile = winf('NTILE');

/**
 * Create a window function that returns the expression evaluated at the row
 * that is offset rows before the current row within the partition.
 * If there is no such row, instead return default (which must be of the same
 * type as the expression). Both offset and default are evaluated with respect
 * to the current row. If omitted, offset defaults to 1 and default to null.
 * @param {string|SQLExpression} expr The expression to evaluate.
 * @param {number|SQLExpression} offset The row offset.
 * @param {*} default The default value.
 * @returns {WindowFunction} The generated window function.
 */
export const lag = winf('LAG');

/**
 * Create a window function that returns the expression evaluated at the row
 * that is offset rows after the current row within the partition.
 * If there is no such row, instead return default (which must be of the same
 * type as the expression). Both offset and default are evaluated with respect
 * to the current row. If omitted, offset defaults to 1 and default to null.
 * @param {string|SQLExpression} expr The expression to evaluate.
 * @param {number|SQLExpression} offset The row offset.
 * @param {*} default The default value.
 * @returns {WindowFunction} The generated window function.
 */
export const lead = winf('LEAD');

/**
 * Create a window function that returns the expression evaluated at the row
 * that is the first row of the window frame.
 * @param {string|SQLExpression} expr The expression to evaluate.
 * @returns {WindowFunction} The generated window function.
 */
export const first_value = winf('FIRST_VALUE');

/**
 * Create a window function that returns the expression evaluated at the row
 * that is the last row of the window frame.
 * @param {string|SQLExpression} expr The expression to evaluate.
 * @returns {WindowFunction} The generated window function.
 */

export const last_value = winf('LAST_VALUE');

/**
 * Create a window function that returns the expression evaluated at the
 * nth row of the window frame (counting from 1), or null if no such row.
 * @param {string|SQLExpression} expr The expression to evaluate.
 * @param {number|SQLExpression} nth The 1-based window frame index.
 * @returns {WindowFunction} The generated window function.
 */
export const nth_value = winf('NTH_VALUE');
