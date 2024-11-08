import { expect, describe, it } from 'vitest';
import { stubParam } from './util/stub-param.js';
import { column, cume_dist, dense_rank, desc, first_value, isParamLike, lag, last_value, lead, nth_value, ntile, percent_rank, rank, row_number } from '../src/index.js';
import { columns } from './util/columns.js';

describe('Window functions', () => {
  it('include accessible metadata', () => {
    const expr = lead('foo');
    expect(expr.func.name).toBe('lead');
    expect(columns(expr)).toStrictEqual(['foo']);
  });

  it('support named window definition', () => {
    const expr = cume_dist().over('win');
    expect(expr.func.name).toBe('cume_dist');
    expect(expr.def.name).toBe('win');
    expect(String(expr)).toBe('cume_dist() OVER "win"');
  });

  it('support partition by', () => {
    const expr = cume_dist().partitionby('foo', 'bar');
    expect(String(expr)).toBe('cume_dist() OVER (PARTITION BY "foo", "bar")');
  });

  it('support order by', () => {
    const expr = cume_dist().orderby('a', desc('b'));
    expect(String(expr)).toBe('cume_dist() OVER (ORDER BY "a", "b" DESC)');
  });

  it('support rows frame', () => {
    expect(String(first_value('foo').rows([0, null])))
      .toBe('first_value("foo") OVER (ROWS BETWEEN CURRENT ROW AND UNBOUNDED FOLLOWING)');
    expect(String(first_value('foo').rows([null, null])))
      .toBe('first_value("foo") OVER (ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING)');
    expect(String(first_value('foo').rows([0, 2])))
      .toBe('first_value("foo") OVER (ROWS BETWEEN CURRENT ROW AND 2 FOLLOWING)');
    expect(String(first_value('foo').rows([2, 0])))
      .toBe('first_value("foo") OVER (ROWS BETWEEN 2 PRECEDING AND CURRENT ROW)');
  });

  it('support range frame', () => {
    expect(String(first_value('foo').range([0, null])))
      .toBe('first_value("foo") OVER (RANGE BETWEEN CURRENT ROW AND UNBOUNDED FOLLOWING)');
    expect(String(first_value('foo').range([null, null])))
      .toBe('first_value("foo") OVER (RANGE BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING)');
    expect(String(first_value('foo').range([0, 2])))
      .toBe('first_value("foo") OVER (RANGE BETWEEN CURRENT ROW AND 2 FOLLOWING)');
    expect(String(first_value('foo').range([2, 0])))
      .toBe('first_value("foo") OVER (RANGE BETWEEN 2 PRECEDING AND CURRENT ROW)');
  });

  it('support window name, partition by, order by, and frame', () => {
    const expr = cume_dist()
      .over('base')
      .partitionby('foo', 'bar')
      .orderby('a', desc('b'))
      .rows([0, +Infinity]);
    expect(String(expr)).toBe('cume_dist() OVER ('
      + '"base" '
      + 'PARTITION BY "foo", "bar" '
      + 'ORDER BY "a", "b" DESC '
      + 'ROWS BETWEEN CURRENT ROW AND UNBOUNDED FOLLOWING)'
    );
  });

  it('support parameterized expressions', () => {
    const col = stubParam(column('bar'));
    expect(isParamLike(col)).toBe(true);

    const expr = first_value(col);
    expect(String(expr)).toBe('first_value("bar") OVER ()');
    expect(columns(expr)).toStrictEqual(['bar']);

    col.update(column('baz'));
    expect(String(expr)).toBe('first_value("baz") OVER ()');
    expect(columns(expr)).toStrictEqual(['baz']);
  });

  it('include row_number', () => {
    expect(String(row_number())).toBe('row_number() OVER ()');
  });

  it('include rank', () => {
    expect(String(rank())).toBe('rank() OVER ()');
  });

  it('include dense_rank', () => {
    expect(String(dense_rank())).toBe('dense_rank() OVER ()');
  });

  it('include percent_rank', () => {
    expect(String(percent_rank())).toBe('percent_rank() OVER ()');
  });

  it('include cume_dist', () => {
    expect(String(cume_dist())).toBe('cume_dist() OVER ()');
  });

  it('include ntile', () => {
    expect(String(ntile(5))).toBe('ntile(5) OVER ()');
  });

  it('include lag', () => {
    expect(String(lag('foo', 2))).toBe('lag("foo", 2) OVER ()');
  });

  it('include lead', () => {
    expect(String(lead('foo', 2))).toBe('lead("foo", 2) OVER ()');
  });

  it('include first_value', () => {
    expect(String(first_value('foo'))).toBe('first_value("foo") OVER ()');
  });

  it('include last_value', () => {
    expect(String(last_value('foo'))).toBe('last_value("foo") OVER ()');
  });

  it('include nth_value', () => {
    expect(String(nth_value('foo', 2))).toBe('nth_value("foo", 2) OVER ()');
  });
});
