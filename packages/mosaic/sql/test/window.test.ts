import { expect, describe, it } from 'vitest';
import { stubParam } from './util/stub-param.js';
import { column, cume_dist, days, dense_rank, desc, first_value, following, frameGroups, frameRange, frameRows, isParamLike, lag, last_value, lead, nth_value, ntile, percent_rank, preceding, rank, row_number } from '../src/index.js';
import { columns } from './util/columns.js';
import { validateExpr, validateQuery } from './util/validate.js';
import { currentRow } from '../src/functions/window-frame.js';

describe('Window functions', () => {
  it('include accessible metadata', async () => {
    const expr = lead('num1');
    expect(expr.func.name).toBe('lead');
    expect(columns(expr)).toStrictEqual(['num1']);
    await validateExpr(expr);
  });

  it('support named window definition', async () => {
    const expr = cume_dist().over('win');
    expect(expr.func.name).toBe('cume_dist');
    expect(expr.def.name).toBe('win');
    expect(String(expr)).toBe('cume_dist() OVER "win"');
    // A named window reference must be declared in a WINDOW clause to bind.
    await validateQuery(`SELECT ${expr} FROM "t1" WINDOW "win" AS ()`);
  });

  it('support partition by', async () => {
    const expr = cume_dist().partitionby('num1', 'num2');
    await expect(expr).toBeValidExpr('cume_dist() OVER (PARTITION BY "num1", "num2")');
  });

  it('support order by', async () => {
    const expr = cume_dist().orderby('num1', desc('num2'));
    await expect(expr).toBeValidExpr('cume_dist() OVER (ORDER BY "num1", "num2" DESC)');
  });

  it('support rows frame', async () => {
    await expect(first_value('num1').frame(frameRows([0, null])))
      .toBeValidExpr('first_value("num1") OVER (ROWS BETWEEN CURRENT ROW AND UNBOUNDED FOLLOWING)');
    await expect(first_value('num1').frame(frameRows([null, null])))
      .toBeValidExpr('first_value("num1") OVER (ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING)');
    await expect(first_value('num1').frame(frameRows([0, 2])))
      .toBeValidExpr('first_value("num1") OVER (ROWS BETWEEN CURRENT ROW AND 2 FOLLOWING)');
    await expect(first_value('num1').frame(frameRows([2, 0])))
      .toBeValidExpr('first_value("num1") OVER (ROWS BETWEEN 2 PRECEDING AND CURRENT ROW)');
    expect(String(first_value('num1').frame(frameRows([2, currentRow()]))))
      .toBe('first_value("num1") OVER (ROWS BETWEEN 2 PRECEDING AND CURRENT ROW)');
    await expect(first_value('num1').frame(frameRows([preceding(2), following(3)])))
      .toBeValidExpr('first_value("num1") OVER (ROWS BETWEEN 2 PRECEDING AND 3 FOLLOWING)');
  });

  it('support range frame', async () => {
    await expect(first_value('num1').frame(frameRange([0, null])))
      .toBeValidExpr('first_value("num1") OVER (RANGE BETWEEN CURRENT ROW AND UNBOUNDED FOLLOWING)');
    await expect(first_value('num1').frame(frameRange([null, null])))
      .toBeValidExpr('first_value("num1") OVER (RANGE BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING)');
    expect(String(first_value('num1').frame(frameRange([0, 2]))))
      .toBe('first_value("num1") OVER (RANGE BETWEEN CURRENT ROW AND 2 FOLLOWING)');
    // RANGE offsets require an ORDER BY column; add one for validation.
    await validateExpr(first_value('num1').frame(frameRange([0, 2])).orderby('num1'));
    expect(String(first_value('num1').frame(frameRange([2, 0]))))
      .toBe('first_value("num1") OVER (RANGE BETWEEN 2 PRECEDING AND CURRENT ROW)');
    await validateExpr(first_value('num1').frame(frameRange([2, 0])).orderby('num1'));
    expect(String(first_value('num1').frame(frameRange([2, currentRow()]))))
      .toBe('first_value("num1") OVER (RANGE BETWEEN 2 PRECEDING AND CURRENT ROW)');
    expect(String(first_value('num1').frame(frameRange([preceding(days(3)), following(days(2))]))))
      .toBe('first_value("num1") OVER (RANGE BETWEEN INTERVAL 3 DAYS PRECEDING AND INTERVAL 2 DAYS FOLLOWING)');
    // Interval offsets require a temporal ORDER BY column.
    await validateExpr(
      first_value('num1')
        .frame(frameRange([preceding(days(3)), following(days(2))]))
        .orderby('ts1')
    );
  });

  it('support groups frame', async () => {
    expect(String(first_value('num1').frame(frameGroups([0, null]))))
      .toBe('first_value("num1") OVER (GROUPS BETWEEN CURRENT ROW AND UNBOUNDED FOLLOWING)');
    // GROUPS frames require an ORDER BY column; add one for validation.
    await validateExpr(first_value('num1').frame(frameGroups([0, null])).orderby('num1'));
    expect(String(first_value('num1').frame(frameGroups([null, null]))))
      .toBe('first_value("num1") OVER (GROUPS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING)');
    await validateExpr(first_value('num1').frame(frameGroups([null, null])).orderby('num1'));
    expect(String(first_value('num1').frame(frameGroups([0, 2]))))
      .toBe('first_value("num1") OVER (GROUPS BETWEEN CURRENT ROW AND 2 FOLLOWING)');
    await validateExpr(first_value('num1').frame(frameGroups([0, 2])).orderby('num1'));
    expect(String(first_value('num1').frame(frameGroups([2, 0]))))
      .toBe('first_value("num1") OVER (GROUPS BETWEEN 2 PRECEDING AND CURRENT ROW)');
    await validateExpr(first_value('num1').frame(frameGroups([2, 0])).orderby('num1'));
    expect(String(first_value('num1').frame(frameGroups([2, currentRow()]))))
      .toBe('first_value("num1") OVER (GROUPS BETWEEN 2 PRECEDING AND CURRENT ROW)');
  });

  it('support window name, partition by, order by, and frame', async () => {
    const expr = cume_dist()
      .over('base')
      .partitionby('num1', 'num2')
      .orderby('num1', desc('num2'))
      .frame(frameRows([0, Infinity]));
    expect(String(expr)).toBe('cume_dist() OVER ('
      + '"base" '
      + 'PARTITION BY "num1", "num2" '
      + 'ORDER BY "num1", "num2" DESC '
      + 'ROWS BETWEEN CURRENT ROW AND UNBOUNDED FOLLOWING)'
    );
    // Not validated: references a base window "base" that would need a WINDOW
    // clause declaration to bind; this test covers the OVER (...) serialization.
  });

  it('support parameterized expressions', async () => {
    const col = stubParam(column('num2'));
    expect(isParamLike(col)).toBe(true);

    const expr = first_value(col);
    await expect(expr).toBeValidExpr('first_value("num2") OVER ()');
    expect(columns(expr)).toStrictEqual(['num2']);

    col.update(column('num3'));
    await expect(expr).toBeValidExpr('first_value("num3") OVER ()');
    expect(columns(expr)).toStrictEqual(['num3']);
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
    await expect(lag('num1', 2)).toBeValidExpr('lag("num1", 2) OVER ()');
  });

  it('include lead', async () => {
    await expect(lead('num1', 2)).toBeValidExpr('lead("num1", 2) OVER ()');
  });

  it('include first_value', async () => {
    await expect(first_value('num1')).toBeValidExpr('first_value("num1") OVER ()');
  });

  it('include last_value', async () => {
    await expect(last_value('num1')).toBeValidExpr('last_value("num1") OVER ()');
  });

  it('include nth_value', async () => {
    await expect(nth_value('num1', 2)).toBeValidExpr('nth_value("num1", 2) OVER ()');
  });
});
