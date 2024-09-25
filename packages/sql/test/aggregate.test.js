import { expect, describe, it } from 'vitest';
import { stubParam } from './stub-param.js';
import {
  agg, column, isSQLExpression, isParamLike,
  argmax, argmin, arrayAgg, avg, corr, count, covarPop, entropy, first,
  kurtosis, mean, mad, max, median, min, mode, last, product, quantile,
  regrAvgX, regrAvgY, regrCount, regrIntercept, regrR2, regrSXX, regrSXY,
  regrSYY, regrSlope, skewness, stddev, stddevPop, stringAgg, sum,
  variance, varPop, sql
} from '../src/index.js';

describe('agg template tag', () => {
  it('creates aggregate SQL expressions', () => {
    const expr = agg`SUM(${column('foo')})`;
    expect(isSQLExpression(expr)).toBe(true);
    expect(isParamLike(expr)).toBe(false);
    expect(String(expr)).toBe('SUM("foo")');
    expect(expr.column).toBe('foo');
    expect(expr.columns).toEqual(['foo']);
  });

  it('creates parameterized aggregate SQL expressions', () => {
    const col = stubParam(column('bar'));
    expect(isParamLike(col)).toBe(true);

    const expr = agg`SUM(${col})`;
    expect(isSQLExpression(expr)).toBe(true);
    expect(isParamLike(expr)).toBe(true);
    expect(String(expr)).toBe('SUM("bar")');
    expect(expr.column).toBe('bar');
    expect(expr.columns).toEqual(['bar']);

    expr.addEventListener('value', value => {
      expect(isSQLExpression(value)).toBe(true);
      expect(String(expr)).toBe(`${value}`);
    });
    col.update(column('baz'));
    expect(String(expr)).toBe('SUM("baz")');
    expect(expr.column).toBe('baz');
    expect(expr.columns).toEqual(['baz']);
  });
});

describe('Aggregate functions', () => {
  it('expose metadata', () => {
    const expr = sum(column('foo'));
    expect(expr.aggregate).toBe('SUM');
    expect(expr.column).toBe('foo');
    expect(expr.columns).toEqual(['foo']);
  });
  it('support distinct', () => {
    const expr = count(column('foo')).distinct();
    expect(expr.aggregate).toBe('COUNT');
    expect(expr.isDistinct).toBe(true);
    expect(expr.type).toBe('INTEGER');
    expect(String(expr)).toBe('COUNT(DISTINCT "foo")::INTEGER');
  });
  it('support filter', () => {
    const foo = column('foo');
    const expr = avg(foo).where(sql`${foo} > 5`);
    expect(String(expr)).toBe('AVG("foo") FILTER (WHERE "foo" > 5)');
  });
  it('include ARG_MAX', () => {
    expect(String(argmax('foo', 'bar'))).toBe('ARG_MAX("foo", "bar")');
  });
  it('include ARG_MIN', () => {
    expect(String(argmin('foo', 'bar'))).toBe('ARG_MIN("foo", "bar")');
  });
  it('include ARRAY_AGG', () => {
    expect(String(arrayAgg('foo'))).toBe('ARRAY_AGG("foo")');
  });
  it('include AVG', () => {
    expect(String(avg('foo'))).toBe('AVG("foo")');
    expect(String(mean('foo'))).toBe('AVG("foo")');
  });
  it('include CORR', () => {
    expect(String(corr('foo', 'bar'))).toBe('CORR("foo", "bar")');
  });
  it('include COUNT', () => {
    expect(String(count())).toBe('COUNT(*)::INTEGER');
  });
  it('include COVAR_POP', () => {
    expect(String(covarPop('foo', 'bar'))).toBe('COVAR_POP("foo", "bar")');
  });
  it('include ENTROPY', () => {
    expect(String(entropy('foo'))).toBe('ENTROPY("foo")');
  });
  it('include FIRST', () => {
    expect(String(first('foo'))).toBe('FIRST("foo")');
  });
  it('include KURTOSIS', () => {
    expect(String(kurtosis('foo'))).toBe('KURTOSIS("foo")');
  });
  it('include MAD', () => {
    expect(String(mad('foo'))).toBe('MAD("foo")');
  });
  it('include MAX', () => {
    expect(String(max('foo'))).toBe('MAX("foo")');
  });
  it('include MEDIAN', () => {
    expect(String(median('foo'))).toBe('MEDIAN("foo")');
  });
  it('include MIN', () => {
    expect(String(min('foo'))).toBe('MIN("foo")');
  });
  it('include MODE', () => {
    expect(String(mode('foo'))).toBe('MODE("foo")');
  });
  it('include LAST', () => {
    expect(String(last('foo'))).toBe('LAST("foo")');
  });
  it('include PRODUCT', () => {
    expect(String(product('foo'))).toBe('PRODUCT("foo")');
  });
  it('include QUANTILE', () => {
    expect(String(quantile('foo', 0.25))).toBe('QUANTILE("foo", 0.25)');
  });
  it('include REGR_AVGX', () => {
    expect(String(regrAvgX('x', 'y'))).toBe('REGR_AVGX("x", "y")');
  });
  it('include REGR_AVGY', () => {
    expect(String(regrAvgY('x', 'y'))).toBe('REGR_AVGY("x", "y")');
  });
  it('include REGR_COUNT', () => {
    expect(String(regrCount('x', 'y'))).toBe('REGR_COUNT("x", "y")');
  });
  it('include REGR_INTERCEPT', () => {
    expect(String(regrIntercept('x', 'y'))).toBe('REGR_INTERCEPT("x", "y")');
  });
  it('include REGR_R2', () => {
    expect(String(regrR2('x', 'y'))).toBe('REGR_R2("x", "y")');
  });
  it('include REGR_SXX', () => {
    expect(String(regrSXX('x', 'y'))).toBe('REGR_SXX("x", "y")');
  });
  it('include REGR_SXY', () => {
    expect(String(regrSXY('x', 'y'))).toBe('REGR_SXY("x", "y")');
  });
  it('include REGR_SYY', () => {
    expect(String(regrSYY('x', 'y'))).toBe('REGR_SYY("x", "y")');
  });
  it('include REGR_SLOPE', () => {
    expect(String(regrSlope('x', 'y'))).toBe('REGR_SLOPE("x", "y")');
  });
  it('include SKEWNESS', () => {
    expect(String(skewness('foo'))).toBe('SKEWNESS("foo")');
  });
  it('include STDDEV', () => {
    expect(String(stddev('foo'))).toBe('STDDEV("foo")');
  });
  it('include STDDEV_POP', () => {
    expect(String(stddevPop('foo'))).toBe('STDDEV_POP("foo")');
  });
  it('include STRING_AGG', () => {
    expect(String(stringAgg('foo'))).toBe('STRING_AGG("foo")');
  });
  it('include SUM', () => {
    expect(String(sum('foo'))).toBe('SUM("foo")::DOUBLE');
  });
  it('include VARIANCE', () => {
    expect(String(variance('foo'))).toBe('VARIANCE("foo")');
  });
  it('include VAR_POP', () => {
    expect(String(varPop('foo'))).toBe('VAR_POP("foo")');
  });
});
