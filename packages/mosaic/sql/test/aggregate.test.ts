import { expect, describe, it } from 'vitest';
import { columns } from './util/columns.js';
import { argmax, argmin, arrayAgg, avg, column, corr, count, covariance, covarPop, entropy, first, geomean, gt, kurtosis, last, mad, max, median, min, mode, product, quantile, regrAvgX, regrAvgY, regrCount, regrIntercept, regrR2, regrSlope, regrSXX, regrSXY, regrSYY, skewness, stddev, stddevPop, stringAgg, sum, variance, varPop } from '../src/index.js';

describe('Aggregate functions', () => {
  it('include accessible metadata', () => {
    const expr = sum('foo');
    expect(expr.name).toBe('sum');
    expect(columns(expr)).toStrictEqual(['foo']);
  });

  it('support distinct', async () => {
    const expr = count('foo').distinct();
    expect(expr.name).toBe('count');
    expect(expr.isDistinct).toBe(true);
    await expect(expr).toBeValidExpr('count(DISTINCT "foo")');
  });

  it('support filter', async () => {
    const foo = column('foo');
    await expect(avg(foo).where(gt(foo, 5)))
      .toBeValidExpr('avg("foo") FILTER (WHERE ("foo" > 5))');
  });

  it('include arg_max', async () => {
    await expect(argmax('foo', 'bar')).toBeValidExpr('arg_max("foo", "bar")');
  });

  it('include arg_min', async () => {
    await expect(argmin('foo', 'bar')).toBeValidExpr('arg_min("foo", "bar")');
  });

  it('include array_agg', async () => {
    await expect(arrayAgg('foo')).toBeValidExpr('array_agg("foo")');
  });

  it('include avg', async () => {
    await expect(avg('foo')).toBeValidExpr('avg("foo")');
  });

  it('include corr', async () => {
    await expect(corr('foo', 'bar')).toBeValidExpr('corr("foo", "bar")');
  });

  it('include count', async () => {
    await expect(count()).toBeValidExpr('count(*)');
    await expect(count('foo')).toBeValidExpr('count("foo")');
  });

  it('include covar_pop', async () => {
    await expect(covarPop('foo', 'bar')).toBeValidExpr('covar_pop("foo", "bar")');
  });

  it('include covar_samp', async () => {
    await expect(covariance('foo', 'bar')).toBeValidExpr('covar_samp("foo", "bar")');
  });

  it('include entropy', async () => {
    await expect(entropy('foo')).toBeValidExpr('entropy("foo")');
  });

  it('include first', async () => {
    await expect(first('foo')).toBeValidExpr('first("foo")');
  });

  it('include geomean', async () => {
    await expect(geomean('foo')).toBeValidExpr('geomean("foo")');
  });

  it('include kurtosis', async () => {
    await expect(kurtosis('foo')).toBeValidExpr('kurtosis("foo")');
  });

  it('include mad', async () => {
    await expect(mad('foo')).toBeValidExpr('mad("foo")');
  });

  it('include max', async () => {
    await expect(max('foo')).toBeValidExpr('max("foo")');
  });

  it('include median', async () => {
    await expect(median('foo')).toBeValidExpr('median("foo")');
  });

  it('include min', async () => {
    await expect(min('foo')).toBeValidExpr('min("foo")');
  });

  it('include mode', async () => {
    await expect(mode('foo')).toBeValidExpr('mode("foo")');
  });

  it('include last', async () => {
    await expect(last('foo')).toBeValidExpr('last("foo")');
  });

  it('include product', async () => {
    await expect(product('foo')).toBeValidExpr('product("foo")');
  });

  it('include quantile', async () => {
    await expect(quantile('foo', 0.25)).toBeValidExpr('quantile("foo", 0.25)');
  });

  it('include regr_avgx', async () => {
    await expect(regrAvgX('x', 'y')).toBeValidExpr('regr_avgx("x", "y")');
  });

  it('include regr_avgy', async () => {
    await expect(regrAvgY('x', 'y')).toBeValidExpr('regr_avgy("x", "y")');
  });

  it('include regr_count', async () => {
    await expect(regrCount('x', 'y')).toBeValidExpr('regr_count("x", "y")');
  });

  it('include regr_intercept', async () => {
    await expect(regrIntercept('x', 'y')).toBeValidExpr('regr_intercept("x", "y")');
  });

  it('include regr_r2', async () => {
    await expect(regrR2('x', 'y')).toBeValidExpr('regr_r2("x", "y")');
  });

  it('include regr_sxx', async () => {
    await expect(regrSXX('x', 'y')).toBeValidExpr('regr_sxx("x", "y")');
  });

  it('include regr_sxy', async () => {
    await expect(regrSXY('x', 'y')).toBeValidExpr('regr_sxy("x", "y")');
  });

  it('include regr_syy', async () => {
    await expect(regrSYY('x', 'y')).toBeValidExpr('regr_syy("x", "y")');
  });

  it('include regr_slope', async () => {
    await expect(regrSlope('x', 'y')).toBeValidExpr('regr_slope("x", "y")');
  });

  it('include skewness', async () => {
    await expect(skewness('foo')).toBeValidExpr('skewness("foo")');
  });

  it('include stddev', async () => {
    await expect(stddev('foo')).toBeValidExpr('stddev("foo")');
  });

  it('include stddev_pop', async () => {
    await expect(stddevPop('foo')).toBeValidExpr('stddev_pop("foo")');
  });

  it('include string_agg', async () => {
    await expect(stringAgg('foo')).toBeValidExpr('string_agg("foo")');
  });

  it('include sum', async () => {
    await expect(sum('foo')).toBeValidExpr('sum("foo")');
  });

  it('include var_samp', async () => {
    await expect(variance('foo')).toBeValidExpr('var_samp("foo")');
  });

  it('include var_pop', async () => {
    await expect(varPop('foo')).toBeValidExpr('var_pop("foo")');
  });
});
