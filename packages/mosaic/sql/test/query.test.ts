import { expect, describe, it } from 'vitest';
import { asTableRef, column, desc, gt, lt, max, min, sql, Query, sum, lead, over, cte, add, FromClauseNode, SampleClauseNode, frameRows, div, mul, unnest, list } from '../src/index.js';

describe('Query', () => {
  it('selects column name strings', async () => {
    const query = 'SELECT "num1", "num2", "num3" FROM "t1"';

    await expect(
      Query
        .select('num1', 'num2', 'num3')
        .from('t1')
    ).toBeValidQuery(query);

    expect(
      Query
        .select('num1', 'num2', 'num3')
        .from(asTableRef('t1')!)
        .toString()
    ).toBe(query);

    expect(
      Query
        .select(['num1', 'num2', 'num3'])
        .from('t1')
        .toString()
    ).toBe(query);

    expect(
      Query
        .select({ num1: 'num1', num2: 'num2', num3: 'num3' })
        .from('t1')
        .toString()
    ).toBe(query);

    expect(
      Query
        .select('num1')
        .select('num2')
        .select('num3')
        .from('t1')
        .toString()
    ).toBe(query);
  });

  it('selects column ref objects', async () => {
    const foo = column('num1');
    const bar = column('num2');
    const baz = column('num3');
    await expect(
      Query
        .select(foo, bar, baz)
        .from('t1')
    ).toBeValidQuery('SELECT "num1", "num2", "num3" FROM "t1"');

    expect(
      Query
        .select([foo, bar, baz])
        .from('t1')
        .toString()
    ).toBe('SELECT "num1", "num2", "num3" FROM "t1"');

    expect(
      Query
        .select({ num1: foo, num2: bar, num3: baz })
        .from('t1')
        .toString()
    ).toBe('SELECT "num1", "num2", "num3" FROM "t1"');

    expect(
      Query
        .select(foo)
        .select(bar)
        .select(baz)
        .from('t1')
        .toString()
    ).toBe('SELECT "num1", "num2", "num3" FROM "t1"');
  });

  it('selects only the most recent reference', async () => {
    const query = 'SELECT "num3", "num1" + 1 AS "num2" FROM "t1"';

    await expect(
      Query
        .select('num1', 'num2', 'num3')
        .select({ num2: sql`"num1" + 1`, num1: null })
        .from('t1')
    ).toBeValidQuery(query);
  });

  it('selects distinct columns', async () => {
    await expect(
      Query
        .select('num1', 'num2', 'num3')
        .distinct()
        .from('t1')
    ).toBeValidQuery('SELECT DISTINCT "num1", "num2", "num3" FROM "t1"');
  });

  it('selects with limit and offset modifiers', async () => {
    await expect(
      Query
        .select('*')
        .from('t1')
        .limit(10)
        .offset(20)
    ).toBeValidQuery('SELECT * FROM "t1" LIMIT 10 OFFSET 20');

    await expect(
      Query
        .select('*')
        .from('t1')
        .limit(div(10, 2))
        .offset(mul(5, 4))
    ).toBeValidQuery('SELECT * FROM "t1" LIMIT (10 / 2) OFFSET (5 * 4)');

    await expect(
      Query
        .select('*')
        .from('t1')
        .limitPercent(div(10, 2))
    ).toBeValidQuery('SELECT * FROM "t1" LIMIT (10 / 2)%');

    await expect(
      Query
        .select('*')
        .from('t1')
        .limitPercent(10)
    ).toBeValidQuery('SELECT * FROM "t1" LIMIT 10%');
  });

  it('selects aggregates', async () => {
    const foo = column('num1');

    await expect(
      Query
        .select({ min: min('num1'), max: max('num1') })
        .from('t1')
    ).toBeValidQuery('SELECT min("num1") AS "min", max("num1") AS "max" FROM "t1"');

    expect(
      Query
        .select({ min: min(foo), max: max(foo) })
        .from('t1')
        .toString()
    ).toBe('SELECT min("num1") AS "min", max("num1") AS "max" FROM "t1"');

    await expect(
      Query
        .select({ min: min('num1').where(gt('num2', 5)) })
        .from('t1')
    ).toBeValidQuery('SELECT min("num1") FILTER (WHERE ("num2" > 5)) AS "min" FROM "t1"');
  });

  it('selects windowed aggregates', async () => {
    const foo = column('num1');

    await expect(
      Query
        .select({ csum: sum('num1').window() })
        .from('t1')
    ).toBeValidQuery('SELECT sum("num1") OVER () AS "csum" FROM "t1"');

    expect(
      Query
        .select({ csum: sum(foo).window() })
        .from('t1')
        .toString()
    ).toBe('SELECT sum("num1") OVER () AS "csum" FROM "t1"');

    expect(
      Query
        .select({ csum: sum(foo).partitionby('num3') })
        .from('t1')
        .toString()
    ).toBe('SELECT sum("num1") OVER (PARTITION BY "num3") AS "csum" FROM "t1"');

    expect(
      Query
        .select({ csum: sum(foo).orderby('int1') })
        .from('t1')
        .toString()
    ).toBe('SELECT sum("num1") OVER (ORDER BY "int1") AS "csum" FROM "t1"');

    await expect(
      Query
        .select({ csum: sum(foo).partitionby('num3').orderby('int1') })
        .from('t1')
    ).toBeValidQuery('SELECT sum("num1") OVER (PARTITION BY "num3" ORDER BY "int1") AS "csum" FROM "t1"');

    await expect(
      Query
        .select({ csum: sum(foo).frame(frameRows([null, 0])) })
        .from('t1')
    ).toBeValidQuery('SELECT sum("num1") OVER (ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS "csum" FROM "t1"');
  });

  it('selects grouped aggregates', async () => {
    const foo = column('num1');
    const bar = column('num2');
    const baz = column('num3');

    const query = [
      'SELECT min("num1") AS "min", max("num1") AS "max", "num2", "num3"',
      'FROM "t1"',
      'GROUP BY "num2", "num3"'
    ].join(' ');
    await expect(
      Query
        .select({ min: min('num1'), max: max('num1'), num2: 'num2', num3: 'num3' })
        .from('t1')
        .groupby('num2', 'num3')
    ).toBeValidQuery(query);

    expect(
      Query
        .select({ min: min(foo), max: max(foo), num2: bar, num3: baz })
        .from('t1')
        .groupby(bar, baz)
        .toString()
    ).toBe(query);

    expect(
      Query
        .select({ min: min(foo), max: max(foo), num2: bar, num3: baz })
        .from('t1')
        .groupby([bar, baz])
        .toString()
    ).toBe(query);

    expect(
      Query
        .select({ min: min(foo), max: max(foo), num2: bar, num3: baz })
        .from('t1')
        .groupby(bar)
        .groupby(baz)
        .toString()
    ).toBe(query);
  });

  it('selects filtered aggregates', async () => {
    const foo = column('num1');
    const bar = column('num2');

    const query = [
      'SELECT min("num1") AS "min", "num2"',
      'FROM "t1"',
      'GROUP BY "num2"',
      'HAVING ("min" > 50) AND ("min" < 100)'
    ].join(' ');
    await expect(
      Query
        .select({ min: min(foo), num2: bar })
        .from('t1')
        .groupby(bar)
        .having(gt('min', 50), lt('min', 100))
    ).toBeValidQuery(query);

    expect(
      Query
        .select({ min: min(foo), num2: bar })
        .from('t1')
        .groupby(bar)
        .having([gt('min', 50), lt('min', 100)])
        .toString()
    ).toBe(query);

    expect(
      Query
        .select({ min: min(foo), num2: bar })
        .from('t1')
        .groupby(bar)
        .having(gt('min', 50))
        .having(lt('min', 100))
        .toString()
    ).toBe(query);

    expect(
      Query
        .select({ min: min(foo), num2: bar })
        .from('t1')
        .groupby(bar)
        .having(sql`("min" > 50) AND ("min" < 100)`)
        .toString()
    ).toBe(query);
  });

  it('selects filtered rows', async () => {
    const foo = column('num1');
    const bar = column('num2');

    const query = [
      'SELECT "num1"',
      'FROM "t1"',
      'WHERE ("num2" > 50) AND ("num2" < 100)'
    ].join(' ');
    await expect(
      Query
        .select(foo)
        .from('t1')
        .where(gt(bar, 50), lt(bar, 100))
    ).toBeValidQuery(query);

    expect(
      Query
        .select(foo)
        .from('t1')
        .where([gt(bar, 50), lt(bar, 100)])
        .toString()
    ).toBe(query);

    expect(
      Query
        .select(foo)
        .from('t1')
        .where(gt(bar, 50))
        .where(lt(bar, 100))
        .toString()
    ).toBe(query);

    expect(
      Query
        .select(foo)
        .from('t1')
        .where(sql`("num2" > 50) AND ("num2" < 100)`)
        .toString()
    ).toBe(query);
  });

  it('selects ordered rows', async () => {
    const bar = column('num2');
    const baz = column('num3');

    const query = [
      'SELECT *',
      'FROM "t1"',
      'ORDER BY "num2", "num3" DESC'
    ].join(' ');
    await expect(
      Query
        .select('*')
        .from('t1')
        .orderby(bar, desc(baz))
    ).toBeValidQuery(query);

    expect(
      Query
        .select('*')
        .from('t1')
        .orderby([bar, desc(baz)])
        .toString()
    ).toBe(query);

    expect(
      Query
        .select('*')
        .from('t1')
        .orderby(bar)
        .orderby(desc(baz))
        .toString()
    ).toBe(query);

    expect(
      Query
        .select('*')
        .from('t1')
        .orderby(sql`"num2", "num3" DESC`)
        .toString()
    ).toBe(query);
  });

  it('selects sampled rows', async () => {
    await expect(
      Query
        .select('*')
        .from('t1')
        .sample(10)
    ).toBeValidQuery('SELECT * FROM "t1" USING SAMPLE (10 ROWS)');

    await expect(
      Query
        .select('*')
        .from('t1')
        .sample(0.3)
    ).toBeValidQuery('SELECT * FROM "t1" USING SAMPLE (30%)');

    await expect(
      Query
        .select('*')
        .from('t1')
        .sample(0.1, 'bernoulli')
    ).toBeValidQuery('SELECT * FROM "t1" USING SAMPLE bernoulli (10%)');

    await expect(
      Query
        .select('*')
        .from('t1')
        .sample(0.1, 'bernoulli', 12345)
    ).toBeValidQuery('SELECT * FROM "t1" USING SAMPLE bernoulli (10%) REPEATABLE (12345)');

    await expect(
      Query
        .select('*')
        .from(new FromClauseNode(
          asTableRef('t1')!, 't1', new SampleClauseNode(10, true)
        ))
    ).toBeValidQuery('SELECT * FROM "t1" TABLESAMPLE (10%)');
  });

  it('selects from multiple relations', async () => {
    const query = [
      'SELECT "a"."num1" AS "num1", "b"."num2" AS "num2"',
      'FROM "t1" AS "a", "t2" AS "b"'
    ].join(' ');
    await expect(
      Query
        .select({
          num1: column('num1', 'a'),
          num2: column('num2', 'b')
        })
        .from({ a: 't1', b: 't2' })
    ).toBeValidQuery(query);
  });

  it('selects from unnested relation', async () => {
    await expect(
      Query
        .select({ type: column('type', 'u') })
        .from(
          new FromClauseNode(
            unnest(list(['Gold', 'Silver', 'Bronze'])),
            'u',
            undefined,
            ['type']
          )
        )
    ).toBeValidQuery(`SELECT "u"."type" AS "type" FROM UNNEST(['Gold', 'Silver', 'Bronze']) AS "u"("type")`);
  });

  it('selects over windows', async () => {
    await expect(
      Query
        .select({ lead: lead('num1').over('win') })
        .from('t1')
        // @ts-expect-error raw sql
        .window({ win: sql`(ORDER BY "num1" ASC)` })
    ).toBeValidQuery('SELECT lead("num1") OVER "win" AS "lead" FROM "t1" WINDOW "win" AS (ORDER BY "num1" ASC)');

    await expect(
      Query
        .select({ lead: lead('num1').over('win') })
        .from('t1')
        .window({ win: over().orderby('num1') })
    ).toBeValidQuery('SELECT lead("num1") OVER "win" AS "lead" FROM "t1" WINDOW "win" AS (ORDER BY "num1")');

    await expect(
      Query
        .select({ lead: lead('num1').over('win') })
        .from('t1')
        .window({ win: over().orderby(desc('num1')) })
    ).toBeValidQuery('SELECT lead("num1") OVER "win" AS "lead" FROM "t1" WINDOW "win" AS (ORDER BY "num1" DESC)');
  });

  it('selects from subqueries', async () => {
    await expect(
      Query
        .select('num1', 'num2')
        .from(Query.select('*').from('t1'))
    ).toBeValidQuery('SELECT "num1", "num2" FROM (SELECT * FROM "t1")');

    await expect(
      Query
        .select('num1', 'num2')
        .from({ a: Query.select('*').from('t1') })
    ).toBeValidQuery('SELECT "num1", "num2" FROM (SELECT * FROM "t1") AS "a"');
  });

  it('selects with common table expressions', async () => {
    await expect(
      Query
        .with({ a: Query.select('*').from('t1') })
        .select('num1', 'num2')
        .from('a')
    ).toBeValidQuery('WITH "a" AS (SELECT * FROM "t1") SELECT "num1", "num2" FROM "a"');

    await expect(
      Query
        .with({
          a: Query.select('num1').from('t1'),
          b: Query.select('num2').from('t2')
        })
        .select('*')
        .from('a', 'b')
    ).toBeValidQuery([
      'WITH "a" AS (SELECT "num1" FROM "t1"),',
           '"b" AS (SELECT "num2" FROM "t2")',
      'SELECT * FROM "a", "b"'
    ].join(' '));

    await expect(Query
      .with(
        cte('foo', Query.select({ x: 42 }), false),
        cte('bar', Query.select({ y: 42 }), true)
      )
      .select({ v: add('x', 'y') })
      .from('foo', 'bar')
    ).toBeValidQuery([
      'WITH "foo" AS NOT MATERIALIZED (SELECT 42 AS "x"),',
           '"bar" AS MATERIALIZED (SELECT 42 AS "y")',
      'SELECT ("x" + "y") AS "v" FROM "foo", "bar"'
    ].join(' '));
  });

  it('performs set operations', async () => {
    const q = [
      Query.select('num1', 'num2', 'num3').from('t1'),
      Query.select('num1', 'num2', 'num3').from('t2')
    ];
    await expect(Query.union(q)).toBeValidQuery(q.join(' UNION '));
    expect(Query.union(...q).toString()).toBe(q.join(' UNION '));

    await expect(Query.unionByName(q)).toBeValidQuery(q.join(' UNION BY NAME '));
    expect(Query.unionByName(...q).toString()).toBe(q.join(' UNION BY NAME '));

    await expect(Query.unionAll(q)).toBeValidQuery(q.join(' UNION ALL '));
    expect(Query.unionAll(...q).toString()).toBe(q.join(' UNION ALL '));

    await expect(Query.unionAllByName(q)).toBeValidQuery(q.join(' UNION ALL BY NAME '));
    expect(Query.unionAllByName(...q).toString()).toBe(q.join(' UNION ALL BY NAME '));

    await expect(Query.intersect(q)).toBeValidQuery(q.join(' INTERSECT '));
    expect(Query.intersect(...q).toString()).toBe(q.join(' INTERSECT '));

    await expect(Query.intersectAll(q)).toBeValidQuery(q.join(' INTERSECT ALL '));
    expect(Query.intersectAll(...q).toString()).toBe(q.join(' INTERSECT ALL '));

    await expect(Query.except(q)).toBeValidQuery(q.join(' EXCEPT '));
    expect(Query.except(...q).toString()).toBe(q.join(' EXCEPT '));

    await expect(Query.exceptAll(q)).toBeValidQuery(q.join(' EXCEPT ALL '));
    expect(Query.exceptAll(...q).toString()).toBe(q.join(' EXCEPT ALL '));
  });

  it('renders set operation query modifiers', async () => {
    const q = [
      Query.select('num1', 'num2', 'num3').from('t1'),
      Query.select('num1', 'num2', 'num3').from('t2')
    ];

    await expect(
      Query
        .unionAll(...q)
        .orderby('num1')
        .limit(0)
        .offset(0)
    ).toBeValidQuery(`${q.join(' UNION ALL ')} ORDER BY "num1" LIMIT 0 OFFSET 0`);
  });

  it('supports describe queries', async () => {
    const q = Query.select('num1', 'num2').from('t1');
    await expect(Query.describe(q)).toBeValidQuery(`DESC ${q}`);

    const u = Query.unionAll(
      Query.select('num1', 'num2').from('t1'),
      Query.select('num1', 'num2').from('t2')
    );
    await expect(Query.describe(u)).toBeValidQuery(`DESC ${u}`);
  });

  it('is cloneable', async () => {
    const q = Query
      .with({
        cte: Query.select('num1', 'num2', 'num3').from('t1')
      })
      .select('num1')
      .from('cte')
      .groupby('num2')
      .orderby('num3')
      .limit(10);
    const c = q.clone();
    expect(c).not.toBe(q);
    expect(c.toString()).toBe(q.toString());
    // Not validated: this query selects "num1" while grouping by "num2" without an
    // aggregate, which DuckDB's binder rejects ("num1" must appear in GROUP BY).
    // The query is only an illustrative fixture for testing clone(); its SQL is
    // intentionally not semantically valid.
    // await validateQuery(q);
  })
});
