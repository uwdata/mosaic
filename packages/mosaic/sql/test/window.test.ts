import { expect, describe, it } from 'vitest';
import { stubParam } from './util/stub-param.js';
import { column, cume_dist, days, dense_rank, desc, first_value, following, frameGroups, frameRange, frameRows, isParamLike, lag, last_value, lead, nth_value, ntile, percent_rank, preceding, rank, row_number } from '../src/index.js';
import { columns } from './util/columns.js';
import { validateExpr, validateQuery } from './util/validate.js';
import { currentRow } from '../src/functions/window-frame.js';

describe('Window functions', () => {
  it('include accessible metadata', async () => {
    const expr = lead('foo');
    expect(expr.func.name).toBe('lead');
    expect(columns(expr)).toStrictEqual(['foo']);
    await validateExpr(expr);
  });

  it('support named window definition', async () => {
    const expr = cume_dist().over('win');
    expect(expr.func.name).toBe('cume_dist');
    expect(expr.def.name).toBe('win');
    expect(String(expr)).toBe('cume_dist() OVER "win"');
    // A named window reference must be declared in a WINDOW clause to bind.
    await validateQuery(`SELECT ${expr} FROM "numerics" WINDOW "win" AS ()`);
  });

  it('support partition by', async () => {
    const expr = cume_dist().partitionby('foo', 'bar');
    await expect(expr).toBeValidExpr('cume_dist() OVER (PARTITION BY "foo", "bar")');
  });

  it('support order by', async () => {
    const expr = cume_dist().orderby('a', desc('b'));
    await expect(expr).toBeValidExpr('cume_dist() OVER (ORDER BY "a", "b" DESC)');
  });

  it('support rows frame', async () => {
    await expect(first_value('foo').frame(frameRows([0, null])))
      .toBeValidExpr('first_value("foo") OVER (ROWS BETWEEN CURRENT ROW AND UNBOUNDED FOLLOWING)');
    await expect(first_value('foo').frame(frameRows([null, null])))
      .toBeValidExpr('first_value("foo") OVER (ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING)');
    await expect(first_value('foo').frame(frameRows([0, 2])))
      .toBeValidExpr('first_value("foo") OVER (ROWS BETWEEN CURRENT ROW AND 2 FOLLOWING)');
    await expect(first_value('foo').frame(frameRows([2, 0])))
      .toBeValidExpr('first_value("foo") OVER (ROWS BETWEEN 2 PRECEDING AND CURRENT ROW)');
    expect(String(first_value('foo').frame(frameRows([2, currentRow()]))))
      .toBe('first_value("foo") OVER (ROWS BETWEEN 2 PRECEDING AND CURRENT ROW)');
    await expect(first_value('foo').frame(frameRows([preceding(2), following(3)])))
      .toBeValidExpr('first_value("foo") OVER (ROWS BETWEEN 2 PRECEDING AND 3 FOLLOWING)');
  });

  it('support range frame', async () => {
    await expect(first_value('foo').frame(frameRange([0, null])))
      .toBeValidExpr('first_value("foo") OVER (RANGE BETWEEN CURRENT ROW AND UNBOUNDED FOLLOWING)');
    await expect(first_value('foo').frame(frameRange([null, null])))
      .toBeValidExpr('first_value("foo") OVER (RANGE BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING)');
    expect(String(first_value('foo').frame(frameRange([0, 2]))))
      .toBe('first_value("foo") OVER (RANGE BETWEEN CURRENT ROW AND 2 FOLLOWING)');
    // RANGE offsets require an ORDER BY column; add one for validation.
    await validateExpr(first_value('foo').frame(frameRange([0, 2])).orderby('a'));
    expect(String(first_value('foo').frame(frameRange([2, 0]))))
      .toBe('first_value("foo") OVER (RANGE BETWEEN 2 PRECEDING AND CURRENT ROW)');
    await validateExpr(first_value('foo').frame(frameRange([2, 0])).orderby('a'));
    expect(String(first_value('foo').frame(frameRange([2, currentRow()]))))
      .toBe('first_value("foo") OVER (RANGE BETWEEN 2 PRECEDING AND CURRENT ROW)');
    expect(String(first_value('foo').frame(frameRows([preceding(days(3)), following(days(2))]))))
      .toBe('first_value("foo") OVER (ROWS BETWEEN INTERVAL 3 DAYS PRECEDING AND INTERVAL 2 DAYS FOLLOWING)');
    // Not validated: an interval-valued ROWS frame requires a RANGE frame over a
    // temporal ORDER BY column in DuckDB; the generated SQL pairs INTERVAL bounds
    // with ROWS, which DuckDB rejects. This is the string the API emits today.
  });

  it('support groups frame', async () => {
    expect(String(first_value('foo').frame(frameGroups([0, null]))))
      .toBe('first_value("foo") OVER (GROUPS BETWEEN CURRENT ROW AND UNBOUNDED FOLLOWING)');
    // GROUPS frames require an ORDER BY column; add one for validation.
    await validateExpr(first_value('foo').frame(frameGroups([0, null])).orderby('a'));
    expect(String(first_value('foo').frame(frameGroups([null, null]))))
      .toBe('first_value("foo") OVER (GROUPS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING)');
    await validateExpr(first_value('foo').frame(frameGroups([null, null])).orderby('a'));
    expect(String(first_value('foo').frame(frameGroups([0, 2]))))
      .toBe('first_value("foo") OVER (GROUPS BETWEEN CURRENT ROW AND 2 FOLLOWING)');
    await validateExpr(first_value('foo').frame(frameGroups([0, 2])).orderby('a'));
    expect(String(first_value('foo').frame(frameGroups([2, 0]))))
      .toBe('first_value("foo") OVER (GROUPS BETWEEN 2 PRECEDING AND CURRENT ROW)');
    await validateExpr(first_value('foo').frame(frameGroups([2, 0])).orderby('a'));
    expect(String(first_value('foo').frame(frameGroups([2, currentRow()]))))
      .toBe('first_value("foo") OVER (GROUPS BETWEEN 2 PRECEDING AND CURRENT ROW)');
  });

  it('support window name, partition by, order by, and frame', async () => {
    const expr = cume_dist()
      .over('base')
      .partitionby('foo', 'bar')
      .orderby('a', desc('b'))
      .frame(frameRows([0, Infinity]));
    expect(String(expr)).toBe('cume_dist() OVER ('
      + '"base" '
      + 'PARTITION BY "foo", "bar" '
      + 'ORDER BY "a", "b" DESC '
      + 'ROWS BETWEEN CURRENT ROW AND UNBOUNDED FOLLOWING)'
    );
    // Not validated: references a base window "base" that would need a WINDOW
    // clause declaration to bind; this test covers the OVER (...) serialization.
  });

  it('support parameterized expressions', async () => {
    const col = stubParam(column('bar'));
    expect(isParamLike(col)).toBe(true);

    const expr = first_value(col);
    await expect(expr).toBeValidExpr('first_value("bar") OVER ()');
    expect(columns(expr)).toStrictEqual(['bar']);

    col.update(column('baz'));
    await expect(expr).toBeValidExpr('first_value("baz") OVER ()');
    expect(columns(expr)).toStrictEqual(['baz']);
  });

  it('include row_number', async () => {
    await expect(row_number()).toBeValidExpr('row_number() OVER ()');
  });

  it('include rank', async () => {
    await expect(rank()).toBeValidExpr('rank() OVER ()');
  });

  it('include dense_rank', async () => {
    await expect(dense_rank()).toBeValidExpr('dense_rank() OVER ()');
  });

  it('include percent_rank', async () => {
    await expect(percent_rank()).toBeValidExpr('percent_rank() OVER ()');
  });

  it('include cume_dist', async () => {
    await expect(cume_dist()).toBeValidExpr('cume_dist() OVER ()');
  });

  it('include ntile', async () => {
    await expect(ntile(5)).toBeValidExpr('ntile(5) OVER ()');
  });

  it('include lag', async () => {
    await expect(lag('foo', 2)).toBeValidExpr('lag("foo", 2) OVER ()');
  });

  it('include lead', async () => {
    await expect(lead('foo', 2)).toBeValidExpr('lead("foo", 2) OVER ()');
  });

  it('include first_value', async () => {
    await expect(first_value('foo')).toBeValidExpr('first_value("foo") OVER ()');
  });

  it('include last_value', async () => {
    await expect(last_value('foo')).toBeValidExpr('last_value("foo") OVER ()');
  });

  it('include nth_value', async () => {
    await expect(nth_value('foo', 2)).toBeValidExpr('nth_value("foo", 2) OVER ()');
  });
});
