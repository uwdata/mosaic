import { asColumn } from './ref.js';
import { toSQL } from './to-sql.js';
import { SQLExpression, parseSQL } from './expression.js';

/**
 * Tag function for SQL aggregate expressions. Interpolated values
 * may be strings, other SQL expression objects (such as column
 * references), or parameterized values.
 */
export function agg(strings, ...exprs) {
  const { spans, cols } = parseSQL(strings, exprs);
  return new AggregateExpression(spans, cols);
}

/**
 * Base class for aggregate expressions.
 * Most callers should use the `agg` template tag or a dedicated
 * aggregate function rather than instantiate this class.
 */
export class AggregateExpression extends SQLExpression {
  constructor(parts, columns, props) {
    super(parts, columns, props);
    this.aggregate = true;
  }

  where(expr) {
    this.filter = expr;
    return this;
  }

  toString() {
    const { filter } = this;
    const where = filter ? ` FILTER (WHERE ${toSQL(filter)})` : '';
    return `${super.toString()}${where}`;
  }
}

/**
 * Base class for individual aggregate functions.
 * Most callers should use a dedicated aggregate function
 * rather than instantiate this class.
 */
export class AggregateFunction extends AggregateExpression {
  constructor(op, args, type) {
    args = (args || []).map(asColumn);
    const columns = Array.from(new Set(
      args.flatMap(a => Array.isArray(a.columns) ? a.columns : [])
    ));
    const label = op.toLowerCase()
      + (args.length ? ` ${columns.join(', ')}` : '');
    super([], columns, { label });
    this.aggregate = op;
    this.args = args;
    this.type = type;
  }

  distinct() {
    this.isDistinct = true;
    return this;
  }

  toString() {
    const { aggregate, args, isDistinct, filter, type } = this;
    const arg = args.length === 0 ? '*' : args.map(toSQL).join(', ');
    const distinct = isDistinct ? 'DISTINCT ' : '';
    const cast = type ? `::${type}` : '';
    const where = filter ? ` FILTER (WHERE ${toSQL(filter)})` : '';
    return `${aggregate}(${distinct}${arg})${cast}${where}`;
  }
}

function aggf(op, type) {
  return (...args) => new AggregateFunction(op, args, type);
}

export const count = aggf('COUNT', 'INTEGER');
export const avg = aggf('AVG');
export const mean = aggf('AVG');
export const mad = aggf('MAD');
export const max = aggf('MAX');
export const min = aggf('MIN');
export const sum = aggf('SUM');
export const product = aggf('PRODUCT');
export const median = aggf('MEDIAN');
export const quantile = aggf('QUANTILE');
export const mode = aggf('MODE');

export const variance = aggf('VARIANCE');
export const stddev = aggf('STDDEV');
export const skewness = aggf('SKEWNESS');
export const kurtosis = aggf('KURTOSIS');
export const entropy = aggf('ENTROPY');
export const varPop = aggf('VAR_POP');
export const stddevPop = aggf('STDDEV_POP');

export const corr = aggf('CORR');
export const covarPop = aggf('COVAR_POP');
export const regrIntercept = aggf('REGR_INTERCEPT');
export const regrSlope = aggf('REGR_SLOPE');
export const regrCount = aggf('REGR_COUNT');
export const regrR2 = aggf('REGR_R2');
export const regrSYY = aggf('REGR_SYY');
export const regrSXX = aggf('REGR_SXX');
export const regrSXY = aggf('REGR_SXY');
export const regrAvgX = aggf('REGR_AVGX');
export const regrAvgY = aggf('REGR_AVGY');

export const first = aggf('FIRST');
export const last = aggf('LAST');

export const argmin = aggf('ARG_MIN');
export const argmax = aggf('ARG_MAX');

export const stringAgg = aggf('STRING_AGG');
export const arrayAgg = aggf('ARRAY_AGG');
