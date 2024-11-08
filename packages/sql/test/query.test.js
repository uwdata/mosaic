import { expect, describe, it } from 'vitest';
import { asNode, asTableRef, column, desc, gt, lt, max, min, sql, Query, sum, lead, over } from '../src/index.js';

describe('Query', () => {
  it('selects column name strings', () => {
    const query = 'SELECT "foo", "bar", "baz" FROM "data"';

    expect(
      Query
        .select('foo', 'bar', 'baz')
        .from('data')
        .toString()
    ).toBe(query);

    expect(
      Query
        .select('foo', 'bar', 'baz')
        .from(asTableRef('data'))
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

  it('selects column ref objects', () => {
    const foo = column('foo');
    const bar = column('bar');
    const baz = column('baz');

    expect(
      Query
        .select(foo, bar, baz)
        .from('data')
        .toString()
    ).toBe('SELECT "foo", "bar", "baz" FROM "data"');

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

  it('selects only the most recent reference', () => {
    const query = 'SELECT "baz", "foo" + 1 AS "bar" FROM "data"';

    expect(
      Query
        .select('foo', 'bar', 'baz')
        .select({ bar: sql`"foo" + 1`, foo: null })
        .from('data')
        .toString()
    ).toBe(query);
  });

  it('selects distinct columns', () => {
    expect(
      Query
        .select('foo', 'bar', 'baz')
        .distinct()
        .from('data')
        .toString()
    ).toBe('SELECT DISTINCT "foo", "bar", "baz" FROM "data"');
  });

  it('selects aggregates', () => {
    const foo = column('foo');

    expect(
      Query
        .select({ min: min('foo'), max: max('foo') })
        .from('data')
        .toString()
    ).toBe('SELECT min("foo") AS "min", max("foo") AS "max" FROM "data"');

    expect(
      Query
        .select({ min: min(foo), max: max(foo) })
        .from('data')
        .toString()
    ).toBe('SELECT min("foo") AS "min", max("foo") AS "max" FROM "data"');

    expect(
      Query
        .select({ min: min('foo').where(gt('bar', 5)) })
        .from('data')
        .toString()
    ).toBe('SELECT min("foo") FILTER (WHERE ("bar" > 5)) AS "min" FROM "data"');
  });

  it('selects windowed aggregates', () => {
    const foo = column('foo');

    expect(
      Query
        .select({ csum: sum('foo').window() })
        .from('data')
        .toString()
    ).toBe('SELECT sum("foo") OVER () AS "csum" FROM "data"');

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

    expect(
      Query
        .select({ csum: sum(foo).partitionby('baz').orderby('bop') })
        .from('data')
        .toString()
    ).toBe('SELECT sum("foo") OVER (PARTITION BY "baz" ORDER BY "bop") AS "csum" FROM "data"');
  });

  it('selects grouped aggregates', () => {
    const foo = column('foo');
    const bar = column('bar');
    const baz = column('baz');

    const query = [
      'SELECT min("foo") AS "min", max("foo") AS "max", "bar", "baz"',
      'FROM "data"',
      'GROUP BY "bar", "baz"'
    ].join(' ');

    expect(
      Query
        .select({ min: min('foo'), max: max('foo'), bar: 'bar', baz: 'baz' })
        .from('data')
        .groupby('bar', 'baz')
        .toString()
    ).toBe(query);

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

  it('selects filtered aggregates', () => {
    const foo = column('foo');
    const bar = column('bar');

    const query = [
      'SELECT min("foo") AS "min", "bar"',
      'FROM "data"',
      'GROUP BY "bar"',
      'HAVING ("min" > 50) AND ("min" < 100)'
    ].join(' ');

    expect(
      Query
        .select({ min: min(foo), bar })
        .from('data')
        .groupby(bar)
        .having(gt('min', 50), lt('min', 100))
        .toString()
    ).toBe(query);

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

  it('selects filtered rows', () => {
    const foo = column('foo');
    const bar = column('bar');

    const query = [
      'SELECT "foo"',
      'FROM "data"',
      'WHERE ("bar" > 50) AND ("bar" < 100)'
    ].join(' ');

    expect(
      Query
        .select(foo)
        .from('data')
        .where(gt(bar, 50), lt(bar, 100))
        .toString()
    ).toBe(query);

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

  it('selects ordered rows', () => {
    const bar = column('bar');
    const baz = column('baz');

    const query = [
      'SELECT *',
      'FROM "data"',
      'ORDER BY "bar", "baz" DESC'
    ].join(' ');

    expect(
      Query
        .select('*')
        .from('data')
        .orderby(bar, desc(baz))
        .toString()
    ).toBe(query);

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

  it('selects sampled rows', () => {
    expect(
      Query
        .select('*')
        .from('data')
        .sample(10)
        .toString()
    ).toBe('SELECT * FROM "data" USING SAMPLE 10 ROWS');

    expect(
      Query
        .select('*')
        .from('data')
        .sample(0.3)
        .toString()
    ).toBe('SELECT * FROM "data" USING SAMPLE 30%');

    expect(
      Query
        .select('*')
        .from('data')
        .sample(0.1, 'bernoulli')
        .toString()
    ).toBe('SELECT * FROM "data" USING SAMPLE 10% (bernoulli)');

    expect(
      Query
        .select('*')
        .from('data')
        .sample(0.1, 'bernoulli', 12345)
        .toString()
    ).toBe('SELECT * FROM "data" USING SAMPLE 10% (bernoulli, 12345)');
  });

  it('selects from multiple relations', () => {
    const query = [
      'SELECT "a"."foo" AS "foo", "b"."bar" AS "bar"',
      'FROM "data1" AS "a", "data2" AS "b"'
    ].join(' ');

    expect(
      Query
        .select({
          foo: asNode('a.foo'),
          bar: asNode('b.bar')
        })
        .from({ a: 'data1', b: 'data2' })
        .toString()
    ).toBe(query);
  });

  it('selects over windows', () => {
    expect(
      Query
        .select({ lead: lead('foo').over('win') })
        .from('data')
        .window({ win: sql`(ORDER BY "foo" ASC)` })
        .toString()
    ).toBe('SELECT lead("foo") OVER "win" AS "lead" FROM "data" WINDOW "win" AS (ORDER BY "foo" ASC)');

    expect(
      Query
        .select({ lead: lead('foo').over('win') })
        .from('data')
        .window({ win: over().orderby('foo') })
        .toString()
    ).toBe('SELECT lead("foo") OVER "win" AS "lead" FROM "data" WINDOW "win" AS (ORDER BY "foo")');

    expect(
      Query
        .select({ lead: lead('foo').over('win') })
        .from('data')
        .window({ win: over().orderby(desc('foo')) })
        .toString()
    ).toBe('SELECT lead("foo") OVER "win" AS "lead" FROM "data" WINDOW "win" AS (ORDER BY "foo" DESC)');
  });

  it('selects from subqueries', () => {
    expect(
      Query
        .select('foo', 'bar')
        .from(Query.select('*').from('data'))
        .toString()
    ).toBe('SELECT "foo", "bar" FROM (SELECT * FROM "data")');

    expect(
      Query
        .select('foo', 'bar')
        .from({ a: Query.select('*').from('data') })
        .toString()
    ).toBe('SELECT "foo", "bar" FROM (SELECT * FROM "data") AS "a"');
  });

  it('selects with common table expressions', () => {
    expect(
      Query
        .with({ a: Query.select('*').from('data') })
        .select('foo', 'bar')
        .from('a')
        .toString()
    ).toBe('WITH "a" AS (SELECT * FROM "data") SELECT "foo", "bar" FROM "a"');

    expect(
      Query
        .with({
          a: Query.select('foo').from('data1'),
          b: Query.select('bar').from('data2')
        })
        .select('*')
        .from('a', 'b')
        .toString()
    ).toBe([
      'WITH "a" AS (SELECT "foo" FROM "data1"),',
           '"b" AS (SELECT "bar" FROM "data2")',
      'SELECT * FROM "a", "b"'
    ].join(' '));
  });

  it('performs set operations', () => {
    const q = [
      Query.select('foo', 'bar', 'baz').from('data1'),
      Query.select('foo', 'bar', 'baz').from('data2')
    ];

    expect(Query.union(q).toString()).toBe(q.join(' UNION '));
    expect(Query.union(...q).toString()).toBe(q.join(' UNION '));

    expect(Query.unionAll(q).toString()).toBe(q.join(' UNION ALL '));
    expect(Query.unionAll(...q).toString()).toBe(q.join(' UNION ALL '));

    expect(Query.intersect(q).toString()).toBe(q.join(' INTERSECT '));
    expect(Query.intersect(...q).toString()).toBe(q.join(' INTERSECT '));

    expect(Query.except(q).toString()).toBe(q.join(' EXCEPT '));
    expect(Query.except(...q).toString()).toBe(q.join(' EXCEPT '));
  });

  it('supports describe queries', () => {
    const q = Query.select('foo', 'bar').from('data');
    expect(Query.describe(q).toString()).toBe(`DESCRIBE ${q}`);

    const u = Query.unionAll(
      Query.select('foo', 'bar').from('data1'),
      Query.select('foo', 'bar').from('data2')
    );
    expect(Query.describe(u).toString()).toBe(`DESCRIBE ${u}`);
  });
});
