import { expect, describe, it } from 'vitest';
import { abs, add, asVerbatim, collectColumns, collectParams, column, count, isAggregateExpression, sql } from '../src/index.js';
import { stubParam } from './util/stub-param.js';

describe('Visitor functions', () => {
  it('include column collection', () => {
    const a = column('a');
    const b = column('b');

    const expr1 = sql`(${a} + ${b}) / ${a}`;
    expect(collectColumns(expr1)).toStrictEqual([a, b]);

    const expr2 = sql`(${'a'} + ${'b'}) ${'a'}`;
    expect(collectColumns(expr2)).toStrictEqual([]);
  });

  it('include param collection', () => {
    const a = stubParam(1);
    const b = stubParam(2);

    const expr1 = sql`(${a} + ${b}) / ${a}`;
    expect(collectParams(expr1)).toStrictEqual([a, b]);

    const expr2 = sql`(${'a'} + ${'b'}) ${'a'}`;
    expect(collectParams(expr2)).toStrictEqual([]);
  });

  it('include aggregate function detection', () => {
    expect(isAggregateExpression(column('a'))).toBe(0);
    expect(isAggregateExpression(add(1, 2))).toBe(0);
    expect(isAggregateExpression(abs(-1))).toBe(0);

    expect(isAggregateExpression(count())).toBe(1);
    expect(isAggregateExpression(asVerbatim('count(*)'))).toBe(2);
    expect(isAggregateExpression(sql`count(*)`)).toBe(2);
    expect(isAggregateExpression(sql`count(${column('a')})`)).toBe(2);

    expect(isAggregateExpression(count().orderby('a'))).toBe(0);
    expect(isAggregateExpression(asVerbatim('count(*) OVER (ORDER BY a)'))).toBe(0);
    expect(isAggregateExpression(sql`count(*) OVER (ORDER BY a)`)).toBe(0);
    expect(isAggregateExpression(sql`count(${column('a')}) OVER (ORDER BY a)`)).toBe(0);
  });
});
