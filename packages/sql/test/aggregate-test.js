import assert from 'node:assert';
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
    assert.ok(isSQLExpression(expr));
    assert.ok(!isParamLike(expr));
    assert.strictEqual(String(expr), 'SUM("foo")');
    assert.strictEqual(expr.column, 'foo');
    assert.deepStrictEqual(expr.columns, ['foo']);
  });

  it('creates parameterized aggregate SQL expressions', () => {
    const col = stubParam(column('bar'));
    assert.ok(isParamLike(col));

    const expr = agg`SUM(${col})`;
    assert.ok(isSQLExpression(expr));
    assert.ok(isParamLike(expr));
    assert.strictEqual(String(expr), 'SUM("bar")');
    assert.strictEqual(expr.column, 'bar');
    assert.deepStrictEqual(expr.columns, ['bar']);

    expr.addEventListener('value', value => {
      assert.ok(isSQLExpression(value));
      assert.strictEqual(String(expr), `${value}`);
    });
    col.update(column('baz'));
    assert.strictEqual(String(expr), 'SUM("baz")');
    assert.strictEqual(expr.column, 'baz');
    assert.deepStrictEqual(expr.columns, ['baz']);
  });
});

describe('Aggregate functions', () => {
  it('expose metadata', () => {
    const expr = sum(column('foo'));
    assert.strictEqual(expr.aggregate, 'SUM');
    assert.strictEqual(expr.column, 'foo');
    assert.deepStrictEqual(expr.columns, ['foo']);
  });
  it('support distinct', () => {
    const expr = count(column('foo')).distinct();
    assert.strictEqual(expr.aggregate, 'COUNT');
    assert.strictEqual(expr.isDistinct, true);
    assert.strictEqual(expr.type, 'INTEGER');
    assert.strictEqual(String(expr), 'COUNT(DISTINCT "foo")::INTEGER');
  });
  it('support filter', () => {
    const foo = column('foo');
    const expr = avg(foo).where(sql`${foo} > 5`);
    assert.strictEqual(String(expr), 'AVG("foo") FILTER (WHERE "foo" > 5)');
  });
  it('include ARG_MAX', () => {
    assert.strictEqual(String(argmax('foo', 'bar')), 'ARG_MAX("foo", "bar")');
  });
  it('include ARG_MIN', () => {
    assert.strictEqual(String(argmin('foo', 'bar')), 'ARG_MIN("foo", "bar")');
  });
  it('include ARRAY_AGG', () => {
    assert.strictEqual(String(arrayAgg('foo')), 'ARRAY_AGG("foo")');
  });
  it('include AVG', () => {
    assert.strictEqual(String(avg('foo')), 'AVG("foo")');
    assert.strictEqual(String(mean('foo')), 'AVG("foo")');
  });
  it('include CORR', () => {
    assert.strictEqual(String(corr('foo', 'bar')), 'CORR("foo", "bar")');
  });
  it('include COUNT', () => {
    assert.strictEqual(String(count()), 'COUNT(*)::INTEGER');
  });
  it('include COVAR_POP', () => {
    assert.strictEqual(String(covarPop('foo', 'bar')), 'COVAR_POP("foo", "bar")');
  });
  it('include ENTROPY', () => {
    assert.strictEqual(String(entropy('foo')), 'ENTROPY("foo")');
  });
  it('include FIRST', () => {
    assert.strictEqual(String(first('foo')), 'FIRST("foo")');
  });
  it('include KURTOSIS', () => {
    assert.strictEqual(String(kurtosis('foo')), 'KURTOSIS("foo")');
  });
  it('include MAD', () => {
    assert.strictEqual(String(mad('foo')), 'MAD("foo")');
  });
  it('include MAX', () => {
    assert.strictEqual(String(max('foo')), 'MAX("foo")');
  });
  it('include MEDIAN', () => {
    assert.strictEqual(String(median('foo')), 'MEDIAN("foo")');
  });
  it('include MIN', () => {
    assert.strictEqual(String(min('foo')), 'MIN("foo")');
  });
  it('include MODE', () => {
    assert.strictEqual(String(mode('foo')), 'MODE("foo")');
  });
  it('include LAST', () => {
    assert.strictEqual(String(last('foo')), 'LAST("foo")');
  });
  it('include PRODUCT', () => {
    assert.strictEqual(String(product('foo')), 'PRODUCT("foo")');
  });
  it('include QUANTILE', () => {
    assert.strictEqual(String(quantile('foo', 0.25)), 'QUANTILE("foo", 0.25)');
  });
  it('include REGR_AVGX', () => {
    assert.strictEqual(String(regrAvgX('x', 'y')), 'REGR_AVGX("x", "y")');
  });
  it('include REGR_AVGY', () => {
    assert.strictEqual(String(regrAvgY('x', 'y')), 'REGR_AVGY("x", "y")');
  });
  it('include REGR_COUNT', () => {
    assert.strictEqual(String(regrCount('x', 'y')), 'REGR_COUNT("x", "y")');
  });
  it('include REGR_INTERCEPT', () => {
    assert.strictEqual(String(regrIntercept('x', 'y')), 'REGR_INTERCEPT("x", "y")');
  });
  it('include REGR_R2', () => {
    assert.strictEqual(String(regrR2('x', 'y')), 'REGR_R2("x", "y")');
  });
  it('include REGR_SXX', () => {
    assert.strictEqual(String(regrSXX('x', 'y')), 'REGR_SXX("x", "y")');
  });
  it('include REGR_SXY', () => {
    assert.strictEqual(String(regrSXY('x', 'y')), 'REGR_SXY("x", "y")');
  });
  it('include REGR_SYY', () => {
    assert.strictEqual(String(regrSYY('x', 'y')), 'REGR_SYY("x", "y")');
  });
  it('include REGR_SLOPE', () => {
    assert.strictEqual(String(regrSlope('x', 'y')), 'REGR_SLOPE("x", "y")');
  });
  it('include SKEWNESS', () => {
    assert.strictEqual(String(skewness('foo')), 'SKEWNESS("foo")');
  });
  it('include STDDEV', () => {
    assert.strictEqual(String(stddev('foo')), 'STDDEV("foo")');
  });
  it('include STDDEV_POP', () => {
    assert.strictEqual(String(stddevPop('foo')), 'STDDEV_POP("foo")');
  });
  it('include STRING_AGG', () => {
    assert.strictEqual(String(stringAgg('foo')), 'STRING_AGG("foo")');
  });
  it('include SUM', () => {
    assert.strictEqual(String(sum('foo')), 'SUM("foo")::DOUBLE');
  });
  it('include VARIANCE', () => {
    assert.strictEqual(String(variance('foo')), 'VARIANCE("foo")');
  });
  it('include VAR_POP', () => {
    assert.strictEqual(String(varPop('foo')), 'VAR_POP("foo")');
  });
});
