import { asColumn, Ref } from './ref.js';
import { toSQL } from './to-sql.js';

export class Aggregate {
  constructor(op, args) {
    this.aggregate = op;
    this.args = (args || []).map(asColumn);
  }

  rewrite(columnMap) {
    const args = this.args.map(arg => {
      return arg instanceof Ref && columnMap.has(arg.column)
        ? columnMap.get(arg.column)
        : arg;
    });
    return new Aggregate(this.aggregate, args);
  }

  get label() {
    return this.aggregate.toLowerCase()
      + (this.args.length ? ` ${this.columns.join(', ')}` : '');
  }

  get column() {
    return this.columns[0];
  }

  get columns() {
    return this.args.flatMap(a => a.columns || []);
  }

  distinct() {
    this.isDistinct = true;
    return this;
  }

  where(expr) {
    this.filter = expr;
    return this;
  }

  toString() {
    const { aggregate, args, isDistinct, filter } = this;
    const arg = args.length === 0 ? '*' : args.map(toSQL).join(', ');
    const distinct = isDistinct ? 'DISTINCT ' : '';
    const where = filter ? ` FILTER (WHERE ${toSQL(filter)})` : '';
    const cast = aggregate === 'COUNT' ? '::INTEGER' : '';
    return where && cast
      ? `(${aggregate}(${distinct}${arg})${where})${cast}`
      : `${aggregate}(${distinct}${arg})${where}${cast}`;
  }
}

function agg(op) {
  return (...args) => new Aggregate(op, args);
}

export const count = agg('COUNT');
export const avg = agg('AVG');
export const mean = agg('AVG');
export const mad = agg('MAD');
export const max = agg('MAX');
export const min = agg('MIN');
export const sum = agg('SUM');
export const product = agg('PRODUCT');
export const median = agg('MEDIAN');
export const quantile = agg('QUANTILE');
export const mode = agg('MODE');

export const variance = agg('VARIANCE');
export const stddev = agg('STDDEV');
export const skewness = agg('SKEWNESS');
export const kurtosis = agg('KURTOSIS');
export const entropy = agg('ENTROPY');
export const varPop = agg('VAR_POP');
export const stddevPop = agg('STDDEV_POP');

export const corr = agg('CORR');
export const covarPop = agg('COVAR_POP');
export const regrIntercept = agg('REGR_INTERCEPT');
export const regrSlope = agg('REGR_SLOPE');
export const regrCount = agg('REGR_COUNT');
export const regrR2 = agg('REGR_R2');
export const regrSYY = agg('REGR_SYY');
export const regrSXX = agg('REGR_SXX');
export const regrSXY = agg('REGR_SXY');
export const regrAvgX = agg('REGR_AVGX');
export const regrAvgY = agg('REGR_AVGY');

export const first = agg('FIRST');
export const last = agg('LAST');

export const argmin = agg('ARG_MIN');
export const argmax = agg('ARG_MAX');

export const stringAgg = agg('STRING_AGG');
export const arrayAgg = agg('ARRAY_AGG');
