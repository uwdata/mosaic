import { expect, describe, it } from 'vitest';
import { stubParam } from './stub-param.js';
import {
  column, desc, isParamLike, isSQLExpression,
  row_number, rank, dense_rank, percent_rank, cume_dist,
  ntile, lag, lead, first_value, last_value, nth_value
} from '../src/index.js';

describe('Window functions', () => {
  it('expose metadata', () => {
    const expr = lead('foo');
    expect(expr.window).toBe('LEAD');
    expect(expr.column).toBe('foo');
    expect(expr.columns).toEqual(['foo']);
  });
  it('support window name', () => {
    const expr = cume_dist().over('win');
    expect(expr.window).toBe('CUME_DIST');
    expect(expr.name).toBe('win');
    expect(String(expr)).toBe('CUME_DIST() OVER "win"');
  });
  it('support partition by', () => {
    const expr = cume_dist().partitionby('foo', 'bar');
    expect(String(expr)).toBe('CUME_DIST() OVER (PARTITION BY "foo", "bar")');
  });
  it('support order by', () => {
    const expr = cume_dist().orderby('a', desc('b'));
    expect(String(expr)).toBe('CUME_DIST() OVER (ORDER BY "a", "b" DESC NULLS LAST)');
  });
  it('support rows frame', () => {
    expect(String(first_value('foo').rows([0, null])))
      .toBe('FIRST_VALUE("foo") OVER (ROWS BETWEEN CURRENT ROW AND UNBOUNDED FOLLOWING)');
    expect(String(first_value('foo').rows([null, null])))
      .toBe('FIRST_VALUE("foo") OVER (ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING)');
    expect(String(first_value('foo').rows([0, 2])))
      .toBe('FIRST_VALUE("foo") OVER (ROWS BETWEEN CURRENT ROW AND 2 FOLLOWING)');
    expect(String(first_value('foo').rows([2, 0])))
      .toBe('FIRST_VALUE("foo") OVER (ROWS BETWEEN 2 PRECEDING AND CURRENT ROW)');
  });
  it('support range frame', () => {
    expect(String(first_value('foo').range([0, null])))
      .toBe('FIRST_VALUE("foo") OVER (RANGE BETWEEN CURRENT ROW AND UNBOUNDED FOLLOWING)');
    expect(String(first_value('foo').range([null, null])))
      .toBe('FIRST_VALUE("foo") OVER (RANGE BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING)');
    expect(String(first_value('foo').range([0, 2])))
      .toBe('FIRST_VALUE("foo") OVER (RANGE BETWEEN CURRENT ROW AND 2 FOLLOWING)');
    expect(String(first_value('foo').range([2, 0])))
      .toBe('FIRST_VALUE("foo") OVER (RANGE BETWEEN 2 PRECEDING AND CURRENT ROW)');
  });
  it('support window name, partition by, order by, and frame', () => {
    const expr = cume_dist()
      .over('base')
      .partitionby('foo', 'bar')
      .orderby('a', desc('b'))
      .rows([0, +Infinity]);
    expect(String(expr)).toBe('CUME_DIST() OVER ('
      + '"base" '
      + 'PARTITION BY "foo", "bar" '
      + 'ORDER BY "a", "b" DESC NULLS LAST '
      + 'ROWS BETWEEN CURRENT ROW AND UNBOUNDED FOLLOWING)'
    );
  });
  it('support parameterized expressions', () => {
    const col = stubParam(column('bar'));
    expect(isParamLike(col)).toBe(true);

    const expr = cume_dist(col);
    expect(isSQLExpression(expr)).toBe(true);
    expect(isParamLike(expr)).toBe(true);
    expect(String(expr)).toBe('CUME_DIST("bar") OVER ()');
    expect(expr.column).toBe('bar');
    expect(expr.columns).toEqual(['bar']);

    expr.addEventListener('value', value => {
      expect(isSQLExpression(value)).toBe(true);
      expect(String(expr)).toBe(`${value}`);
    });
    col.update(column('baz'));
    expect(String(expr)).toBe('CUME_DIST("baz") OVER ()');
    expect(expr.column).toBe('baz');
    expect(expr.columns).toEqual(['baz']);
  });
  it('include ROW_NUMBER', () => {
    expect(String(row_number())).toBe('(ROW_NUMBER() OVER ())::INTEGER');
  });
  it('include RANK', () => {
    expect(String(rank())).toBe('(RANK() OVER ())::INTEGER');
  });
  it('include DENSE_RANK', () => {
    expect(String(dense_rank())).toBe('(DENSE_RANK() OVER ())::INTEGER');
  });
  it('include PERCENT_RANK', () => {
    expect(String(percent_rank())).toBe('PERCENT_RANK() OVER ()');
  });
  it('include CUME_DIST', () => {
    expect(String(cume_dist())).toBe('CUME_DIST() OVER ()');
  });
  it('include NTILE', () => {
    expect(String(ntile(5))).toBe('NTILE(5) OVER ()');
  });
  it('include LAG', () => {
    expect(String(lag('foo', 2))).toBe('LAG("foo", 2) OVER ()');
  });
  it('include LEAD', () => {
    expect(String(lead('foo', 2))).toBe('LEAD("foo", 2) OVER ()');
  });
  it('include FIRST_VALUE', () => {
    expect(String(first_value('foo'))).toBe('FIRST_VALUE("foo") OVER ()');
  });
  it('include LAST_VALUE', () => {
    expect(String(last_value('foo'))).toBe('LAST_VALUE("foo") OVER ()');
  });
  it('include NTH_VALUE', () => {
    expect(String(nth_value('foo', 2))).toBe('NTH_VALUE("foo", 2) OVER ()');
  });
});
