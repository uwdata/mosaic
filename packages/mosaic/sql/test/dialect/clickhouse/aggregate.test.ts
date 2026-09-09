import { expect, describe, it } from 'vitest';
import { argmax, argmin, arrayAgg, asc, clickHouseCodeGenerator, column, count, desc, first, geomean, last, mad, mode, product, quantile, regrAvgX, regrAvgY, regrCount, regrIntercept, regrR2, regrSlope, regrSXX, regrSXY, regrSYY, stringAgg, sum } from '../../../src/index.js';

const gen = clickHouseCodeGenerator;

describe('ClickHouse aggregate overrides', () => {
  it('rewrites arg_max', () => {
    expect(argmax('foo', 'bar').toString(gen)).toBe('argMax("foo", "bar")');
  });

  it('rewrites arg_min', () => {
    expect(argmin('foo', 'bar').toString(gen)).toBe('argMin("foo", "bar")');
  });

  it('rewrites aggregate filters', () => {
    expect(sum('foo').where(column('t')).toString(gen))
      .toBe('sumIf("foo", "t")');
    expect(count().where(column('t')).toString(gen))
      .toBe('countIf("t")');
    expect(argmax('foo', 'bar').where(column('t')).toString(gen))
      .toBe('argMaxIf("foo", "bar", "t")');
    expect(quantile('foo', 0.25).where(column('t')).toString(gen))
      .toBe('quantileExactLowIf(0.25)("foo", "t")');
  });

  it('combines distinct and filter aggregate combinators', () => {
    expect(count('foo').distinct().where(column('t')).toString(gen))
      .toBe('countDistinctIf("foo", "t")');
  });

  it('rejects aggregate argument ordering', () => {
    expect(() => arrayAgg('x').argOrder(asc('y')).toString(gen))
      .toThrow(/Aggregate argument ordering is not supported/);
    expect(() => stringAgg('x').argOrder(desc('y')).toString(gen))
      .toThrow(/Aggregate argument ordering is not supported/);
  });

  it('throws on first', () => {
    expect(() => first('foo').toString(gen))
      .toThrow(/first.* is not supported in ClickHouse/);
  });

  it('throws on last', () => {
    expect(() => last('foo').toString(gen))
      .toThrow(/last.* is not supported in ClickHouse/);
  });

  it('rewrites quantile', () => {
    expect(quantile('foo', 0.25).toString(gen)).toBe('quantileExactLow(0.25)("foo")');
  });

  it('rewrites mode', () => {
    expect(mode('foo').toString(gen)).toBe('topK(1)("foo")[1]');
  });

  it('rewrites geomean', () => {
    expect(geomean('foo').toString(gen)).toBe('exp(avg(ln("foo")))');
  });

  it('rewrites product', () => {
    expect(product('foo').toString(gen)).toBe(
      'if(empty(groupArray("foo")), NULL, arrayProduct(groupArray("foo")))'
    );
    expect(product('foo').distinct().toString(gen)).toBe(
      'if(empty(groupArrayDistinct("foo")), NULL, arrayProduct(groupArrayDistinct("foo")))'
    );
  });

  it('preserves filters in rewritten aggregates', () => {
    expect(mode('foo').where(column('t')).toString(gen))
      .toBe('topKIf(1)("foo", "t")[1]');
    expect(geomean('foo').where(column('t')).toString(gen))
      .toBe('exp(avgIf(ln("foo"), "t"))');
    expect(product('foo').where(column('t')).toString(gen))
      .toBe('if(empty(groupArrayIf("foo", "t")), NULL, arrayProduct(groupArrayIf("foo", "t")))');
    expect(product('foo').distinct().where(column('t')).toString(gen))
      .toBe('if(empty(groupArrayDistinctIf("foo", "t")), NULL, arrayProduct(groupArrayDistinctIf("foo", "t")))');
  });

  it('rewrites mad', () => {
    expect(mad('foo').toString(gen)).toBe(
      `arrayReduce('median', arrayMap(_v -> abs(_v - arrayReduce('median', groupArray("foo"))), groupArray("foo")))`
    );
  });

  it('composes mad with a user FILTER clause', () => {
    expect(mad('foo').where(column('t')).toString(gen)).toBe(
      `arrayReduce('median', arrayMap(_v -> abs(_v - arrayReduce('median', groupArrayIf("foo", "t"))), groupArrayIf("foo", "t")))`
    );
  });

  it('rewrites regr_count', () => {
    expect(regrCount('y', 'x').toString(gen))
      .toBe(`countIf(("y") IS NOT NULL AND ("x") IS NOT NULL)`);
  });

  it('rewrites regr_avgx', () => {
    expect(regrAvgX('y', 'x').toString(gen))
      .toBe(`avgIf("x", ("y") IS NOT NULL AND ("x") IS NOT NULL)`);
  });

  it('rewrites regr_avgy', () => {
    expect(regrAvgY('y', 'x').toString(gen))
      .toBe(`avgIf("y", ("y") IS NOT NULL AND ("x") IS NOT NULL)`);
  });

  it('rewrites regr_sxx', () => {
    expect(regrSXX('y', 'x').toString(gen))
      .toBe(`(varSampIf("x", ("y") IS NOT NULL AND ("x") IS NOT NULL) * (countIf(("y") IS NOT NULL AND ("x") IS NOT NULL) - 1))`);
  });

  it('rewrites regr_syy', () => {
    expect(regrSYY('y', 'x').toString(gen))
      .toBe(`(varSampIf("y", ("y") IS NOT NULL AND ("x") IS NOT NULL) * (countIf(("y") IS NOT NULL AND ("x") IS NOT NULL) - 1))`);
  });

  it('rewrites regr_sxy', () => {
    expect(regrSXY('y', 'x').toString(gen))
      .toBe(`(covarSampIf("y", "x", ("y") IS NOT NULL AND ("x") IS NOT NULL) * (countIf(("y") IS NOT NULL AND ("x") IS NOT NULL) - 1))`);
  });

  it('rewrites regr_slope', () => {
    expect(regrSlope('y', 'x').toString(gen))
      .toBe(`(covarSampIf("y", "x", ("y") IS NOT NULL AND ("x") IS NOT NULL) / varSampIf("x", ("y") IS NOT NULL AND ("x") IS NOT NULL))`);
  });

  it('rewrites regr_intercept', () => {
    expect(regrIntercept('y', 'x').toString(gen))
      .toBe(`(avgIf("y", ("y") IS NOT NULL AND ("x") IS NOT NULL) - (covarSampIf("y", "x", ("y") IS NOT NULL AND ("x") IS NOT NULL) / varSampIf("x", ("y") IS NOT NULL AND ("x") IS NOT NULL)) * avgIf("x", ("y") IS NOT NULL AND ("x") IS NOT NULL))`);
  });

  it('rewrites regr_r2', () => {
    expect(regrR2('y', 'x').toString(gen))
      .toBe(`(pow(corrIf("y", "x", ("y") IS NOT NULL AND ("x") IS NOT NULL), 2))`);
  });

  it('composes regr_* with a user FILTER clause', () => {
    expect(regrSlope('y', 'x').where(column('t')).toString(gen))
      .toBe(`(covarSampIf("y", "x", (("y") IS NOT NULL AND ("x") IS NOT NULL) AND ("t")) / varSampIf("x", (("y") IS NOT NULL AND ("x") IS NOT NULL) AND ("t")))`);
  });

  it('rejects DISTINCT regression aggregates', () => {
    expect(() => regrSlope('y', 'x').distinct().toString(gen))
      .toThrow(/DISTINCT is not supported for regr_slope/);
    expect(() => regrCount('y', 'x').distinct().toString(gen))
      .toThrow(/DISTINCT is not supported for regr_count/);
  });
});
