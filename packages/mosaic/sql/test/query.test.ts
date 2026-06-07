import { expect, describe, it } from 'vitest';
import { asTableRef, column, desc, gt, lt, max, min, sql, Query, sum, lead, over, cte, add, FromClauseNode, SampleClauseNode, frameRows, div, mul } from '../src/index.js';

describe('Query', () => {
  it('selects column name strings', async () => {
    const query = 'SELECT "foo", "bar", "baz" FROM "data"';

    await expect(
      Query
        .select('foo', 'bar', 'baz')
        .from('data')
    ).toBeValidQuery(query);

    expect(
      Query
        .select('foo', 'bar', 'baz')
        .from(asTableRef('data')!)
        .toString()
    ).toBe(query);

    expect(
      Query
        .select(['foo', 'bar', 'baz'])
        .from('data')
        .toString()
    ).toBe(query);

    expect(
      Query
        .select({ foo: 'foo', bar: 'bar', baz: 'baz' })
        .from('data')
        .toString()
    ).toBe(query);

    expect(
      Query
        .select('foo')
        .select('bar')
        .select('baz')
        .from('data')
        .toString()
    ).toBe(query);
  });

  it('selects column ref objects', async () => {
    const foo = column('foo');
    const bar = column('bar');
    const baz = column('baz');
    await expect(
      Query
        .select(foo, bar, baz)
        .from('data')
    ).toBeValidQuery('SELECT "foo", "bar", "baz" FROM "data"');

    expect(
      Query
        .select([foo, bar, baz])
        .from('data')
        .toString()
    ).toBe('SELECT "foo", "bar", "baz" FROM "data"');

    expect(
      Query
        .select({ foo, bar, baz })
        .from('data')
        .toString()
    ).toBe('SELECT "foo", "bar", "baz" FROM "data"');

    expect(
      Query
        .select(foo)
        .select(bar)
        .select(baz)
        .from('data')
        .toString()
    ).toBe('SELECT "foo", "bar", "baz" FROM "data"');
  });

  it('selects only the most recent reference', async () => {
    const query = 'SELECT "baz", "foo" + 1 AS "bar" FROM "data"';

    await expect(
      Query
        .select('foo', 'bar', 'baz')
        .select({ bar: sql`"foo" + 1`, foo: null })
        .from('data')
    ).toBeValidQuery(query);
  });

  it('selects distinct columns', async () => {
    await expect(
      Query
        .select('foo', 'bar', 'baz')
        .distinct()
        .from('data')
    ).toBeValidQuery('SELECT DISTINCT "foo", "bar", "baz" FROM "data"');
  });

  it('selects with limit and offset modifiers', async () => {
    await expect(
      Query
        .select('*')
        .from('data')
        .limit(10)
        .offset(20)
    ).toBeValidQuery('SELECT * FROM "data" LIMIT 10 OFFSET 20');

    await expect(
      Query
        .select('*')
        .from('data')
        .limit(div(10, 2))
        .offset(mul(5, 4))
    ).toBeValidQuery('SELECT * FROM "data" LIMIT (10 / 2) OFFSET (5 * 4)');

    await expect(
      Query
        .select('*')
        .from('data')
        .limitPercent(div(10, 2))
    ).toBeValidQuery('SELECT * FROM "data" LIMIT (10 / 2)%');

    await expect(
      Query
        .select('*')
        .from('data')
        .limitPercent(10)
    ).toBeValidQuery('SELECT * FROM "data" LIMIT 10%');
  });

  it('selects aggregates', async () => {
    const foo = column('foo');

    await expect(
      Query
        .select({ min: min('foo'), max: max('foo') })
        .from('data')
    ).toBeValidQuery('SELECT min("foo") AS "min", max("foo") AS "max" FROM "data"');

    expect(
      Query
        .select({ min: min(foo), max: max(foo) })
        .from('data')
        .toString()
    ).toBe('SELECT min("foo") AS "min", max("foo") AS "max" FROM "data"');

    await expect(
      Query
        .select({ min: min('foo').where(gt('bar', 5)) })
        .from('data')
    ).toBeValidQuery('SELECT min("foo") FILTER (WHERE ("bar" > 5)) AS "min" FROM "data"');
  });

  it('selects windowed aggregates', async () => {
    const foo = column('foo');

    await expect(
      Query
        .select({ csum: sum('foo').window() })
        .from('data')
    ).toBeValidQuery('SELECT sum("foo") OVER () AS "csum" FROM "data"');

    expect(
      Query
        .select({ csum: sum(foo).window() })
        .from('data')
        .toString()
    ).toBe('SELECT sum("foo") OVER () AS "csum" FROM "data"');

    expect(
      Query
        .select({ csum: sum(foo).partitionby('baz') })
        .from('data')
        .toString()
    ).toBe('SELECT sum("foo") OVER (PARTITION BY "baz") AS "csum" FROM "data"');

    expect(
      Query
        .select({ csum: sum(foo).orderby('bop') })
        .from('data')
        .toString()
    ).toBe('SELECT sum("foo") OVER (ORDER BY "bop") AS "csum" FROM "data"');

    await expect(
      Query
        .select({ csum: sum(foo).partitionby('baz').orderby('bop') })
        .from('data')
    ).toBeValidQuery('SELECT sum("foo") OVER (PARTITION BY "baz" ORDER BY "bop") AS "csum" FROM "data"');

    await expect(
      Query
        .select({ csum: sum(foo).frame(frameRows([null, 0])) })
        .from('data')
    ).toBeValidQuery('SELECT sum("foo") OVER (ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS "csum" FROM "data"');
  });

  it('selects grouped aggregates', async () => {
    const foo = column('foo');
    const bar = column('bar');
    const baz = column('baz');

    const query = [
      'SELECT min("foo") AS "min", max("foo") AS "max", "bar", "baz"',
      'FROM "data"',
      'GROUP BY "bar", "baz"'
    ].join(' ');
    await expect(
      Query
        .select({ min: min('foo'), max: max('foo'), bar: 'bar', baz: 'baz' })
        .from('data')
        .groupby('bar', 'baz')
    ).toBeValidQuery(query);

    expect(
      Query
        .select({ min: min(foo), max: max(foo), bar: bar, baz: baz })
        .from('data')
        .groupby(bar, baz)
        .toString()
    ).toBe(query);

    expect(
      Query
        .select({ min: min(foo), max: max(foo), bar, baz })
        .from('data')
        .groupby([bar, baz])
        .toString()
    ).toBe(query);

    expect(
      Query
        .select({ min: min(foo), max: max(foo), bar, baz })
        .from('data')
        .groupby(bar)
        .groupby(baz)
        .toString()
    ).toBe(query);
  });

  it('selects filtered aggregates', async () => {
    const foo = column('foo');
    const bar = column('bar');

    const query = [
      'SELECT min("foo") AS "min", "bar"',
      'FROM "data"',
      'GROUP BY "bar"',
      'HAVING ("min" > 50) AND ("min" < 100)'
    ].join(' ');
    await expect(
      Query
        .select({ min: min(foo), bar })
        .from('data')
        .groupby(bar)
        .having(gt('min', 50), lt('min', 100))
    ).toBeValidQuery(query);

    expect(
      Query
        .select({ min: min(foo), bar })
        .from('data')
        .groupby(bar)
        .having([gt('min', 50), lt('min', 100)])
        .toString()
    ).toBe(query);

    expect(
      Query
        .select({ min: min(foo), bar })
        .from('data')
        .groupby(bar)
        .having(gt('min', 50))
        .having(lt('min', 100))
        .toString()
    ).toBe(query);

    expect(
      Query
        .select({ min: min(foo), bar })
        .from('data')
        .groupby(bar)
        .having(sql`("min" > 50) AND ("min" < 100)`)
        .toString()
    ).toBe(query);
  });

  it('selects filtered rows', async () => {
    const foo = column('foo');
    const bar = column('bar');

    const query = [
      'SELECT "foo"',
      'FROM "data"',
      'WHERE ("bar" > 50) AND ("bar" < 100)'
    ].join(' ');
    await expect(
      Query
        .select(foo)
        .from('data')
        .where(gt(bar, 50), lt(bar, 100))
    ).toBeValidQuery(query);

    expect(
      Query
        .select(foo)
        .from('data')
        .where([gt(bar, 50), lt(bar, 100)])
        .toString()
    ).toBe(query);

    expect(
      Query
        .select(foo)
        .from('data')
        .where(gt(bar, 50))
        .where(lt(bar, 100))
        .toString()
    ).toBe(query);

    expect(
      Query
        .select(foo)
        .from('data')
        .where(sql`("bar" > 50) AND ("bar" < 100)`)
        .toString()
    ).toBe(query);
  });

  it('selects ordered rows', async () => {
    const bar = column('bar');
    const baz = column('baz');

    const query = [
      'SELECT *',
      'FROM "data"',
      'ORDER BY "bar", "baz" DESC'
    ].join(' ');
    await expect(
      Query
        .select('*')
        .from('data')
        .orderby(bar, desc(baz))
    ).toBeValidQuery(query);

    expect(
      Query
        .select('*')
        .from('data')
        .orderby([bar, desc(baz)])
        .toString()
    ).toBe(query);

    expect(
      Query
        .select('*')
        .from('data')
        .orderby(bar)
        .orderby(desc(baz))
        .toString()
    ).toBe(query);

    expect(
      Query
        .select('*')
        .from('data')
        .orderby(sql`"bar", "baz" DESC`)
        .toString()
    ).toBe(query);
  });

  it('selects sampled rows', async () => {
    await expect(
      Query
        .select('*')
        .from('data')
        .sample(10)
    ).toBeValidQuery('SELECT * FROM "data" USING SAMPLE (10 ROWS)');

    await expect(
      Query
        .select('*')
        .from('data')
        .sample(0.3)
    ).toBeValidQuery('SELECT * FROM "data" USING SAMPLE (30%)');

    await expect(
      Query
        .select('*')
        .from('data')
        .sample(0.1, 'bernoulli')
    ).toBeValidQuery('SELECT * FROM "data" USING SAMPLE bernoulli (10%)');

    await expect(
      Query
        .select('*')
        .from('data')
        .sample(0.1, 'bernoulli', 12345)
    ).toBeValidQuery('SELECT * FROM "data" USING SAMPLE bernoulli (10%) REPEATABLE (12345)');

    await expect(
      Query
        .select('*')
        .from(new FromClauseNode(
          asTableRef('foo')!, 'foo', new SampleClauseNode(10, true)
        ))
    ).toBeValidQuery('SELECT * FROM "foo" TABLESAMPLE (10%)');
  });

  it('selects from multiple relations', async () => {
    const query = [
      'SELECT "a"."foo" AS "foo", "b"."bar" AS "bar"',
      'FROM "data1" AS "a", "data2" AS "b"'
    ].join(' ');
    await expect(
      Query
        .select({
          foo: column('foo', 'a'),
          bar: column('bar', 'b')
        })
        .from({ a: 'data1', b: 'data2' })
    ).toBeValidQuery(query);
  });

  it('selects over windows', async () => {
    await expect(
      Query
        .select({ lead: lead('foo').over('win') })
        .from('data')
        // @ts-expect-error raw sql
        .window({ win: sql`(ORDER BY "foo" ASC)` })
    ).toBeValidQuery('SELECT lead("foo") OVER "win" AS "lead" FROM "data" WINDOW "win" AS (ORDER BY "foo" ASC)');

    await expect(
      Query
        .select({ lead: lead('foo').over('win') })
        .from('data')
        .window({ win: over().orderby('foo') })
    ).toBeValidQuery('SELECT lead("foo") OVER "win" AS "lead" FROM "data" WINDOW "win" AS (ORDER BY "foo")');

    await expect(
      Query
        .select({ lead: lead('foo').over('win') })
        .from('data')
        .window({ win: over().orderby(desc('foo')) })
    ).toBeValidQuery('SELECT lead("foo") OVER "win" AS "lead" FROM "data" WINDOW "win" AS (ORDER BY "foo" DESC)');
  });

  it('selects from subqueries', async () => {
    await expect(
      Query
        .select('foo', 'bar')
        .from(Query.select('*').from('data'))
    ).toBeValidQuery('SELECT "foo", "bar" FROM (SELECT * FROM "data")');

    await expect(
      Query
        .select('foo', 'bar')
        .from({ a: Query.select('*').from('data') })
    ).toBeValidQuery('SELECT "foo", "bar" FROM (SELECT * FROM "data") AS "a"');
  });

  it('selects with common table expressions', async () => {
    await expect(
      Query
        .with({ a: Query.select('*').from('data') })
        .select('foo', 'bar')
        .from('a')
    ).toBeValidQuery('WITH "a" AS (SELECT * FROM "data") SELECT "foo", "bar" FROM "a"');

    await expect(
      Query
        .with({
          a: Query.select('foo').from('data1'),
          b: Query.select('bar').from('data2')
        })
        .select('*')
        .from('a', 'b')
    ).toBeValidQuery([
      'WITH "a" AS (SELECT "foo" FROM "data1"),',
           '"b" AS (SELECT "bar" FROM "data2")',
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
      Query.select('foo', 'bar', 'baz').from('data1'),
      Query.select('foo', 'bar', 'baz').from('data2')
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
      Query.select('foo', 'bar', 'baz').from('data1'),
      Query.select('foo', 'bar', 'baz').from('data2')
    ];

    await expect(
      Query
        .unionAll(...q)
        .orderby('foo')
        .limit(0)
        .offset(0)
    ).toBeValidQuery(`${q.join(' UNION ALL ')} ORDER BY "foo" LIMIT 0 OFFSET 0`);
  });

  it('supports describe queries', async () => {
    const q = Query.select('foo', 'bar').from('data');
    await expect(Query.describe(q)).toBeValidQuery(`DESC ${q}`);

    const u = Query.unionAll(
      Query.select('foo', 'bar').from('data1'),
      Query.select('foo', 'bar').from('data2')
    );
    await expect(Query.describe(u)).toBeValidQuery(`DESC ${u}`);
  });

  it('is cloneable', async () => {
    const q = Query
      .with({
        cte: Query.select('foo', 'bar', 'baz').from('source')
      })
      .select('foo')
      .from('cte')
      .groupby('bar')
      .orderby('baz')
      .limit(10);
    const c = q.clone();
    expect(c).not.toBe(q);
    expect(c.toString()).toBe(q.toString());
    // Not validated: this query selects "foo" while grouping by "bar" without an
    // aggregate, which DuckDB's binder rejects ("foo" must appear in GROUP BY).
    // The query is only an illustrative fixture for testing clone(); its SQL is
    // intentionally not semantically valid.
    // await validateQuery(q);
  })
});
