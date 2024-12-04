import { expect, describe, it } from 'vitest';
import { columns } from './util/columns.js';
import { argmax, argmin, arrayAgg, avg, column, corr, count, covariance, covarPop, entropy, first, gt, kurtosis, last, mad, max, median, min, mode, product, quantile, regrAvgX, regrAvgY, regrCount, regrIntercept, regrR2, regrSlope, regrSXX, regrSXY, regrSYY, skewness, stddev, stddevPop, stringAgg, sum, variance, varPop } from '../src/index.js';

describe('Aggregate functions', () => {
  it('include accessible metadata', () => {
    const expr = sum('foo');
    expect(expr.name).toBe('sum');
    expect(columns(expr)).toStrictEqual(['foo']);
  });

  it('support distinct', () => {
    const expr = count('foo').distinct();
    expect(expr.name).toBe('count');
    expect(expr.isDistinct).toBe(true);
    expect(String(expr)).toBe('count(DISTINCT "foo")');
  });

  it('support filter', () => {
    const foo = column('foo');
    expect(String(avg(foo).where(gt(foo, 5))))
      .toBe('avg("foo") FILTER (WHERE ("foo" > 5))');
  });

  it('include arg_max', () => {
    expect(String(argmax('foo', 'bar'))).toBe('arg_max("foo", "bar")');
  });

  it('include arg_min', () => {
    expect(String(argmin('foo', 'bar'))).toBe('arg_min("foo", "bar")');
  });

  it('include array_agg', () => {
    expect(String(arrayAgg('foo'))).toBe('array_agg("foo")');
  });

  it('include avg', () => {
    expect(String(avg('foo'))).toBe('avg("foo")');
  });

  it('include corr', () => {
    expect(String(corr('foo', 'bar'))).toBe('corr("foo", "bar")');
  });

  it('include count', () => {
    expect(String(count())).toBe('count(*)');
    expect(String(count('foo'))).toBe('count("foo")');
  });

  it('include covar_pop', () => {
    expect(String(covarPop('foo', 'bar'))).toBe('covar_pop("foo", "bar")');
  });

  it('include covar_samp', () => {
    expect(String(covariance('foo', 'bar'))).toBe('covar_samp("foo", "bar")');
  });

  it('include entropy', () => {
    expect(String(entropy('foo'))).toBe('entropy("foo")');
  });

  it('include first', () => {
    expect(String(first('foo'))).toBe('first("foo")');
  });

  it('include kurtosis', () => {
    expect(String(kurtosis('foo'))).toBe('kurtosis("foo")');
  });

  it('include mad', () => {
    expect(String(mad('foo'))).toBe('mad("foo")');
  });

  it('include max', () => {
    expect(String(max('foo'))).toBe('max("foo")');
  });

  it('include median', () => {
    expect(String(median('foo'))).toBe('median("foo")');
  });

  it('include min', () => {
    expect(String(min('foo'))).toBe('min("foo")');
  });

  it('include mode', () => {
    expect(String(mode('foo'))).toBe('mode("foo")');
  });

  it('include last', () => {
    expect(String(last('foo'))).toBe('last("foo")');
  });

  it('include product', () => {
    expect(String(product('foo'))).toBe('product("foo")');
  });

  it('include quantile', () => {
    expect(String(quantile('foo', 0.25))).toBe('quantile("foo", 0.25)');
  });

  it('include regr_avgx', () => {
    expect(String(regrAvgX('x', 'y'))).toBe('regr_avgx("x", "y")');
  });

  it('include regr_avgy', () => {
    expect(String(regrAvgY('x', 'y'))).toBe('regr_avgy("x", "y")');
  });

  it('include regr_count', () => {
    expect(String(regrCount('x', 'y'))).toBe('regr_count("x", "y")');
  });

  it('include regr_intercept', () => {
    expect(String(regrIntercept('x', 'y'))).toBe('regr_intercept("x", "y")');
  });

  it('include regr_r2', () => {
    expect(String(regrR2('x', 'y'))).toBe('regr_r2("x", "y")');
  });

  it('include regr_sxx', () => {
    expect(String(regrSXX('x', 'y'))).toBe('regr_sxx("x", "y")');
  });

  it('include regr_sxy', () => {
    expect(String(regrSXY('x', 'y'))).toBe('regr_sxy("x", "y")');
  });

  it('include regr_syy', () => {
    expect(String(regrSYY('x', 'y'))).toBe('regr_syy("x", "y")');
  });

  it('include regr_slope', () => {
    expect(String(regrSlope('x', 'y'))).toBe('regr_slope("x", "y")');
  });

  it('include skewness', () => {
    expect(String(skewness('foo'))).toBe('skewness("foo")');
  });

  it('include stddev', () => {
    expect(String(stddev('foo'))).toBe('stddev("foo")');
  });

  it('include stddev_pop', () => {
    expect(String(stddevPop('foo'))).toBe('stddev_pop("foo")');
  });

  it('include string_agg', () => {
    expect(String(stringAgg('foo'))).toBe('string_agg("foo")');
  });

  it('include sum', () => {
    expect(String(sum('foo'))).toBe('sum("foo")');
  });

  it('include var_samp', () => {
    expect(String(variance('foo'))).toBe('var_samp("foo")');
  });

  it('include var_pop', () => {
    expect(String(varPop('foo'))).toBe('var_pop("foo")');
  });
});
