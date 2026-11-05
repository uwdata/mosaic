import { expect, describe, it } from 'vitest';
import { columns } from './util/columns.js';
import { compareAll, compareAny, isAggregateExpression, max, Query } from '../src/index.js';

describe('Quantified comparison operators', () => {
  const sub = Query.select('num2').from('t2');

  it('include compareAny', async () => {
    await expect(compareAny('num1', '>', sub))
      .toBeValidExpr('("num1" > ANY (SELECT "num2" FROM "t2"))');
  });

  it('include compareAll', async () => {
    await expect(compareAll('num1', '<=', sub))
      .toBeValidExpr('("num1" <= ALL (SELECT "num2" FROM "t2"))');
  });

  it('collect columns from both sides', () => {
    expect(columns(compareAny('num1', '=', sub))).toStrictEqual(['num1', 'num2']);
  });

  it('do not report subquery aggregates', () => {
    const agg = Query.select({ m: max('num2') }).from('t2');
    expect(isAggregateExpression(compareAny('num1', '<', agg))).toBe(0);
  });
});
