import { expect, describe, it } from 'vitest';
import { abs, add, asVerbatim, collectAggregates, collectColumns, collectParams, column, count, div, eq, isAggregateExpression, join, Query, ScalarSubqueryNode, sql, sum, WindowDefNode } from '../src/index.js';
import type { ExprNode } from '../src/index.js';
import { stubParam } from './util/stub-param.js';
import { validateQuery } from './util/validate.js';

// mirrors vgplot markQuery: fields not detected as aggregates become
// GROUP BY dimensions
function markStyleQuery(fields: Record<string, ExprNode>) {
  const q = Query.from('t1').select(fields);
  const entries = Object.entries(fields);
  const dims = entries
    .filter(([, f]) => !isAggregateExpression(f))
    .map(([as]) => as);
  if (dims.length < entries.length) q.groupby(dims);
  return q;
}

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

  it('include columns inside a join condition', () => {
    const q = Query.select('*').from(
      join('t1', 't2', { on: eq(column('a', 't1'), column('b', 't2')) })
    );
    const cols = collectColumns(q).map(c => c.column);
    expect(cols).toContain('a');
    expect(cols).toContain('b');
  });

  it('include params inside a join condition', () => {
    const p = stubParam(1);
    const q = Query.select('*').from(
      join('t1', 't2', { on: eq(column('a', 't1'), p) })
    );
    expect(collectParams(q)).toStrictEqual([p]);
  });

  it('include aggregate collection', async () => {
    const aggQuery = Query.select({
      count: count(),
      sum: sum('num1'),
      mix: add(sum('num1'), sum('num2'))
    }).from('t1');
    expect(collectAggregates(aggQuery)).toHaveLength(4);
    await validateQuery(aggQuery);

    const normQuery = Query.select({
      norm: div(1, new ScalarSubqueryNode(Query.select({ count: count() }).from('t1')))
    }).from('t1');
    expect(collectAggregates(normQuery)).toHaveLength(0);
    await validateQuery(normQuery);
  });

  it('include aggregate function detection', () => {
    expect(isAggregateExpression(column('a'))).toBe(0);
    expect(isAggregateExpression(add(1, 2))).toBe(0);
    expect(isAggregateExpression(abs(-1))).toBe(0);

    expect(isAggregateExpression(count())).toBe(1);
    expect(isAggregateExpression(sum(sum('foo')).orderby('a'))).toBe(1);

    expect(isAggregateExpression(asVerbatim('count(*)'))).toBe(2);
    expect(isAggregateExpression(sql`count(*)`)).toBe(2);
    expect(isAggregateExpression(sql`count(${column('a')})`)).toBe(2);

    expect(isAggregateExpression(count().orderby('a'))).toBe(0);
    expect(isAggregateExpression(asVerbatim('count(*) OVER (ORDER BY a)'))).toBe(0);
    expect(isAggregateExpression(sql`count(*) OVER (ORDER BY a)`)).toBe(0);
    expect(isAggregateExpression(sql`count(${column('a')}) OVER (ORDER BY a)`)).toBe(0);
  });

  it('include whitespace-tolerant verbatim window detection', async () => {
    const variants: [string, ExprNode][] = [
      ['avg(num1) OVER(PARTITION BY txt1)', sql`avg(num1) OVER(PARTITION BY txt1)`],
      ['avg(num1)\nOVER (PARTITION BY txt1)', sql`avg(num1)\nOVER (PARTITION BY txt1)`],
      ['avg(num1)  over (partition by txt1)', sql`avg(num1)  over (partition by txt1)`],
      ['avg(num1) OVER (PARTITION BY txt1)', sql`avg(num1) OVER (PARTITION BY txt1)`]
    ];
    for (const [text, expr] of variants) {
      expect(isAggregateExpression(expr)).toBe(0);
      await expect(markStyleQuery({ y: expr, d: sql`txt2` })).toBeValidQuery(
        `SELECT ${text} AS "y", txt2 AS "d" FROM "t1"`
      );
    }
  });

  it('include named-window verbatim window detection', async () => {
    const expr = sql`avg(num1) OVER win`;
    expect(isAggregateExpression(expr)).toBe(0);
    const q = markStyleQuery({ y: expr, d: sql`txt2` })
      .window({ win: new WindowDefNode().partitionby('txt1') });
    await expect(q).toBeValidQuery(
      'SELECT avg(num1) OVER win AS "y", txt2 AS "d" FROM "t1" '
      + 'WINDOW "win" AS (PARTITION BY "txt1")'
    );
  });
});
