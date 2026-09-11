import { expect, describe, it } from 'vitest';
import { columns } from './util/columns.js';
import { argmax, argmin, arrayAgg, avg, column, corr, count, covariance, covarPop, entropy, first, geomean, gt, kurtosis, last, mad, max, median, min, mode, product, quantile, regrAvgX, regrAvgY, regrCount, regrIntercept, regrR2, regrSlope, regrSXX, regrSXY, regrSYY, skewness, stddev, stddevPop, stringAgg, sum, variance, varPop } from '../src/index.js';

describe('Aggregate functions', () => {
  it('include accessible metadata', () => {
    const expr = sum('num1');
    expect(expr.name).toBe('sum');
    expect(columns(expr)).toStrictEqual(['num1']);
  });

  it('support distinct', async () => {
    const expr = count('num1').distinct();
    expect(expr.name).toBe('count');
    expect(expr.isDistinct).toBe(true);
    await expect(expr).toBeValidExpr('count(DISTINCT "num1")');
  });

  it('support filter', async () => {
    const foo = column('num1');
    await expect(avg(foo).where(gt(foo, 5)))
      .toBeValidExpr('avg("num1") FILTER (WHERE ("num1" > 5))');
  });

  it('include arg_max', async () => {
    await expect(argmax('num1', 'num2')).toBeValidExpr('arg_max("num1", "num2")');
  });

  it('include arg_min', async () => {
    await expect(argmin('num1', 'num2')).toBeValidExpr('arg_min("num1", "num2")');
  });

  it('include array_agg', async () => {
    await expect(arrayAgg('num1')).toBeValidExpr('array_agg("num1")');
  });

  it('include avg', async () => {
    await expect(avg('num1')).toBeValidExpr('avg("num1")');
  });

  it('include corr', async () => {
    await expect(corr('num1', 'num2')).toBeValidExpr('corr("num1", "num2")');
  });

  it('include count', async () => {
    await expect(count()).toBeValidExpr('count(*)');
    await expect(count('num1')).toBeValidExpr('count("num1")');
  });

  it('include covar_pop', async () => {
    await expect(covarPop('num1', 'num2')).toBeValidExpr('covar_pop("num1", "num2")');
  });

  it('include covar_samp', async () => {
    await expect(covariance('num1', 'num2')).toBeValidExpr('covar_samp("num1", "num2")');
  });

  it('include entropy', async () => {
    await expect(entropy('num1')).toBeValidExpr('entropy("num1")');
  });

  it('include first', async () => {
    await expect(first('num1')).toBeValidExpr('first("num1")');
  });

  it('include geomean', async () => {
    await expect(geomean('num1')).toBeValidExpr('geomean("num1")');
  });

  it('include kurtosis', async () => {
    await expect(kurtosis('num1')).toBeValidExpr('kurtosis("num1")');
  });

  it('include mad', async () => {
    await expect(mad('num1')).toBeValidExpr('mad("num1")');
  });

  it('include max', async () => {
    await expect(max('num1')).toBeValidExpr('max("num1")');
  });

  it('include median', async () => {
    await expect(median('num1')).toBeValidExpr('median("num1")');
  });

  it('include min', async () => {
    await expect(min('num1')).toBeValidExpr('min("num1")');
  });

  it('include mode', async () => {
    await expect(mode('num1')).toBeValidExpr('mode("num1")');
  });

  it('include last', async () => {
    await expect(last('num1')).toBeValidExpr('last("num1")');
  });

  it('include product', async () => {
    await expect(product('num1')).toBeValidExpr('product("num1")');
  });

  it('include quantile', async () => {
    await expect(quantile('num1', 0.25)).toBeValidExpr('quantile("num1", 0.25)');
  });

  it('include regr_avgx', async () => {
    await expect(regrAvgX('num1', 'num2')).toBeValidExpr('regr_avgx("num1", "num2")');
  });

  it('include regr_avgy', async () => {
    await expect(regrAvgY('num1', 'num2')).toBeValidExpr('regr_avgy("num1", "num2")');
  });

  it('include regr_count', async () => {
    await expect(regrCount('num1', 'num2')).toBeValidExpr('regr_count("num1", "num2")');
  });

  it('include regr_intercept', async () => {
    await expect(regrIntercept('num1', 'num2')).toBeValidExpr('regr_intercept("num1", "num2")');
  });

  it('include regr_r2', async () => {
    await expect(regrR2('num1', 'num2')).toBeValidExpr('regr_r2("num1", "num2")');
  });

  it('include regr_sxx', async () => {
    await expect(regrSXX('num1', 'num2')).toBeValidExpr('regr_sxx("num1", "num2")');
  });

  it('include regr_sxy', async () => {
    await expect(regrSXY('num1', 'num2')).toBeValidExpr('regr_sxy("num1", "num2")');
  });

  it('include regr_syy', async () => {
    await expect(regrSYY('num1', 'num2')).toBeValidExpr('regr_syy("num1", "num2")');
  });

  it('include regr_slope', async () => {
    await expect(regrSlope('num1', 'num2')).toBeValidExpr('regr_slope("num1", "num2")');
  });

  it('include skewness', async () => {
    await expect(skewness('num1')).toBeValidExpr('skewness("num1")');
  });

  it('include stddev', async () => {
    await expect(stddev('num1')).toBeValidExpr('stddev("num1")');
  });

  it('include stddev_pop', async () => {
    await expect(stddevPop('num1')).toBeValidExpr('stddev_pop("num1")');
  });

  it('include string_agg', async () => {
    await expect(stringAgg('num1')).toBeValidExpr('string_agg("num1")');
  });

  it('include sum', async () => {
    await expect(sum('num1')).toBeValidExpr('sum("num1")');
  });

  it('include var_samp', async () => {
    await expect(variance('num1')).toBeValidExpr('var_samp("num1")');
  });

  it('include var_pop', async () => {
    await expect(varPop('num1')).toBeValidExpr('var_pop("num1")');
  });
});
