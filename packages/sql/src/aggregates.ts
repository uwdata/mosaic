import { SQLExpression, parseSQL, sql } from "./expression";
import { asColumn } from "./ref";
import { repeat } from "./repeat";
import { literalToSQL } from "./to-sql";
import { WindowFunction } from "./windows";

/**
 * Tag function for SQL aggregate expressions. Interpolated values
 * may be strings, other SQL expression objects (such as column
 * references), or parameterized values.
 */
export function agg(strings: any, ...exprs: any[]) {
  return sql(strings, ...exprs).annotate({ aggregate: true });
}

/**
 * Base class for individual aggregate functions.
 * Most callers should use a dedicated aggregate function
 * rather than instantiate this class.
 */
export class AggregateFunction extends SQLExpression {
  isDistinct: boolean;
  filter: SQLExpression | null;
  type: string | null;
  aggregate: string;
  args: SQLExpression[];

  constructor(
    op: string,
    args: any[],
    type: string | null = null,
    isDistinct?: boolean,
    filter?: SQLExpression | null
  ) {
    args = (args || []).map(asColumn);
    const { strings, exprs } = aggExpr(op, args, type, isDistinct, filter);
    const { spans, cols } = parseSQL(strings, exprs);
    super(spans, cols);
    this.aggregate = op;
    this.args = args;
    this.type = type;
    this.isDistinct = isDistinct || false;
    this.filter = filter || null;

    // generate the label
    const dist = this.isDistinct ? "DISTINCT " : "";
    const tail = this.args.length ? `(${dist}${this.args.join(", ")})` : "";
    this.label = `${op.toLowerCase()}${tail}`;
  }

  get basis() {
    return this.column;
  }

  distinct() {
    const { aggregate: op, args, type, filter } = this;
    return new AggregateFunction(op, args, type, true, filter);
  }

  where(filter: SQLExpression | null) {
    const { aggregate: op, args, type, isDistinct } = this;
    return new AggregateFunction(op, args, type, isDistinct, filter);
  }

  window() {
    const { aggregate: op, args, type, isDistinct } = this;
    const func = new AggregateFunction(op, args, null, isDistinct);
    return new WindowFunction(op, func, type);
  }

  partitionby(...expr: any[]) {
    return this.window().partitionby(...expr);
  }

  orderby(...expr: any[]) {
    return this.window().orderby(...expr);
  }

  rows([start, end]: [any, any]) {
    return this.window().rows([start, end]);
  }

  range([start, end]: [any, any]) {
    return this.window().range([start, end]);
  }
}

function aggExpr(
  op: string,
  args: string[],
  type: string | null = null,
  isDistinct?: boolean,
  filter?: SQLExpression | null
) {
  const close = `)${type ? `::${type}` : ""}`;
  let strings = [`${op}(${isDistinct ? "DISTINCT " : ""}`];
  let exprs: (string | SQLExpression)[] = [];
  if (args.length) {
    strings = strings.concat([
      ...repeat(args.length - 1, ", "),
      `${close}${filter ? " FILTER (WHERE " : ""}`,
      ...(filter ? [")"] : []),
    ]);
    exprs = [...args, ...(filter ? [filter] : [])];
  } else {
    strings[0] += "*" + close;
  }
  return { exprs, strings };
}

function unquoted(value: any) {
  const s = literalToSQL(value);
  return s && s.startsWith('"') && s.endsWith('"') ? s.slice(1, -1) : s;
}

function aggf(op: string, type?: string) {
  return (...args: any) => new AggregateFunction(op, args, type);
}

export const count = aggf("COUNT", "INTEGER");
export const avg = aggf("AVG");
export const mean = aggf("AVG");
export const mad = aggf("MAD");
export const max = aggf("MAX");
export const min = aggf("MIN");
export const sum = aggf("SUM", "DOUBLE");
export const product = aggf("PRODUCT");
export const median = aggf("MEDIAN");
export const quantile = aggf("QUANTILE");
export const mode = aggf("MODE");

export const variance = aggf("VARIANCE");
export const stddev = aggf("STDDEV");
export const skewness = aggf("SKEWNESS");
export const kurtosis = aggf("KURTOSIS");
export const entropy = aggf("ENTROPY");
export const varPop = aggf("VAR_POP");
export const stddevPop = aggf("STDDEV_POP");

export const corr = aggf("CORR");
export const covarPop = aggf("COVAR_POP");
export const regrIntercept = aggf("REGR_INTERCEPT");
export const regrSlope = aggf("REGR_SLOPE");
export const regrCount = aggf("REGR_COUNT");
export const regrR2 = aggf("REGR_R2");
export const regrSYY = aggf("REGR_SYY");
export const regrSXX = aggf("REGR_SXX");
export const regrSXY = aggf("REGR_SXY");
export const regrAvgX = aggf("REGR_AVGX");
export const regrAvgY = aggf("REGR_AVGY");

export const first = aggf("FIRST");
export const last = aggf("LAST");

export const argmin = aggf("ARG_MIN");
export const argmax = aggf("ARG_MAX");

export const stringAgg = aggf("STRING_AGG");
export const arrayAgg = aggf("ARRAY_AGG");
