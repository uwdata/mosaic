import assert from 'node:assert';
import {
  column, desc, expr, gt, lt, max, min, relation, Query
} from '../../src/sql/index.js';

describe('Query', () => {
  it('selects column name strings', () => {
    const sql = 'SELECT "foo", "bar", "baz" FROM "data"';

    assert.strictEqual(
      Query
        .select('foo', 'bar', 'baz')
        .from('data')
        .toString(),
      sql
    );

    assert.strictEqual(
      Query
        .select('foo', 'bar', 'baz')
        .from(relation('data'))
        .toString(),
      sql
    );

    assert.strictEqual(
      Query
        .select(['foo', 'bar', 'baz'])
        .from('data')
        .toString(),
      sql
    );

    assert.strictEqual(
      Query
        .select({ foo: 'foo', bar: 'bar', baz: 'baz' })
        .from('data')
        .toString(),
      sql
    );

    assert.strictEqual(
      Query
        .select('foo')
        .select('bar')
        .select('baz')
        .from('data')
        .toString(),
      sql
    );
  });

  it('selects column ref objects', () => {
    const foo = column('foo');
    const bar = column('bar');
    const baz = column('baz');

    assert.strictEqual(
      Query
        .select(foo, bar, baz)
        .from('data')
        .toString(),
      'SELECT "foo", "bar", "baz" FROM "data"'
    );

    assert.strictEqual(
      Query
        .select([foo, bar, baz])
        .from('data')
        .toString(),
      'SELECT "foo", "bar", "baz" FROM "data"'
    );

    assert.strictEqual(
      Query
        .select({ foo, bar, baz })
        .from('data')
        .toString(),
      'SELECT "foo", "bar", "baz" FROM "data"'
    );

    assert.strictEqual(
      Query
        .select(foo)
        .select(bar)
        .select(baz)
        .from('data')
        .toString(),
      'SELECT "foo", "bar", "baz" FROM "data"'
    );
  });

  it('selects distinct columns', () => {
    assert.strictEqual(
      Query
        .select('foo', 'bar', 'baz')
        .distinct()
        .from('data')
        .toString(),
      'SELECT DISTINCT "foo", "bar", "baz" FROM "data"'
    );
  });

  it('selects aggregates', () => {
    const foo = column('foo');

    assert.strictEqual(
      Query
        .select({ min: min('foo'), max: max('foo') })
        .from('data')
        .toString(),
      'SELECT MIN("foo") AS "min", MAX("foo") AS "max" FROM "data"'
    );

    assert.strictEqual(
      Query
        .select({ min: min(foo), max: max(foo) })
        .from('data')
        .toString(),
      'SELECT MIN("foo") AS "min", MAX("foo") AS "max" FROM "data"'
    );

    assert.strictEqual(
      Query
        .select({ min: min('foo').where(gt('bar', 5)) })
        .from('data')
        .toString(),
      'SELECT MIN("foo") FILTER (WHERE ("bar" > 5)) AS "min" FROM "data"'
    );
  });

  it('selects grouped aggregates', () => {
    const foo = column('foo');
    const bar = column('bar');
    const baz = column('baz');

    const sql = [
      'SELECT MIN("foo") AS "min", MAX("foo") AS "max", "bar", "baz"',
      'FROM "data"',
      'GROUP BY "bar", "baz"'
    ].join(' ');

    assert.strictEqual(
      Query
        .select({ min: min('foo'), max: max('foo'), bar: 'bar', baz: 'baz' })
        .from('data')
        .groupby('bar', 'baz')
        .toString(),
      sql
    );

    assert.strictEqual(
      Query
        .select({ min: min(foo), max: max(foo), bar: bar, baz: baz })
        .from('data')
        .groupby(bar, baz)
        .toString(),
      sql
    );

    assert.strictEqual(
      Query
        .select({ min: min(foo), max: max(foo), bar, baz })
        .from('data')
        .groupby([bar, baz])
        .toString(),
      sql
    );

    assert.strictEqual(
      Query
        .select({ min: min(foo), max: max(foo), bar, baz })
        .from('data')
        .groupby(bar)
        .groupby(baz)
        .toString(),
      sql
    );
  });

  it('selects filtered aggregates', () => {
    const foo = column('foo');
    const bar = column('bar');

    const sql = [
      'SELECT MIN("foo") AS "min", "bar"',
      'FROM "data"',
      'GROUP BY "bar"',
      'HAVING ("min" > 50) AND ("min" < 100)'
    ].join(' ');

    assert.strictEqual(
      Query
        .select({ min: min(foo), bar })
        .from('data')
        .groupby(bar)
        .having(gt('min', 50), lt('min', 100))
        .toString(),
      sql
    );

    assert.strictEqual(
      Query
        .select({ min: min(foo), bar })
        .from('data')
        .groupby(bar)
        .having([gt('min', 50), lt('min', 100)])
        .toString(),
      sql
    );

    assert.strictEqual(
      Query
        .select({ min: min(foo), bar })
        .from('data')
        .groupby(bar)
        .having(gt('min', 50))
        .having(lt('min', 100))
        .toString(),
      sql
    );

    assert.strictEqual(
      Query
        .select({ min: min(foo), bar })
        .from('data')
        .groupby(bar)
        .having(expr('("min" > 50) AND ("min" < 100)'))
        .toString(),
      sql
    );
  });

  it('selects filtered rows', () => {
    const foo = column('foo');
    const bar = column('bar');

    const sql = [
      'SELECT "foo"',
      'FROM "data"',
      'WHERE ("bar" > 50) AND ("bar" < 100)'
    ].join(' ');

    assert.strictEqual(
      Query
        .select(foo)
        .from('data')
        .where(gt(bar, 50), lt(bar, 100))
        .toString(),
      sql
    );

    assert.strictEqual(
      Query
        .select(foo)
        .from('data')
        .where([gt(bar, 50), lt(bar, 100)])
        .toString(),
      sql
    );

    assert.strictEqual(
      Query
        .select(foo)
        .from('data')
        .where(gt(bar, 50))
        .where(lt(bar, 100))
        .toString(),
      sql
    );

    assert.strictEqual(
      Query
        .select(foo)
        .from('data')
        .where(expr('("bar" > 50) AND ("bar" < 100)'))
        .toString(),
      sql
    );
  });

  it('selects ordered rows', () => {
    const foo = column('foo');
    const bar = column('bar');
    const baz = column('baz');

    const sql = [
      'SELECT *',
      'FROM "data"',
      'ORDER BY "bar", "baz" DESC NULLS LAST'
    ].join(' ');

    assert.strictEqual(
      Query
        .select('*')
        .from('data')
        .orderby(bar, desc(baz))
        .toString(),
      sql
    );

    assert.strictEqual(
      Query
        .select('*')
        .from('data')
        .orderby([bar, desc(baz)])
        .toString(),
      sql
    );

    assert.strictEqual(
      Query
        .select('*')
        .from('data')
        .orderby(bar)
        .orderby(desc(baz))
        .toString(),
      sql
    );

    assert.strictEqual(
      Query
        .select('*')
        .from('data')
        .orderby(expr('"bar", "baz" DESC NULLS LAST'))
        .toString(),
      sql
    );
  });

  it('selects sampled rows', () => {
    assert.strictEqual(
      Query
        .select('*')
        .from('data')
        .sample(10)
        .toString(),
      'SELECT * FROM "data" USING SAMPLE 10 ROWS'
    );

    assert.strictEqual(
      Query
        .select('*')
        .from('data')
        .sample({ rows: 10 })
        .toString(),
      'SELECT * FROM "data" USING SAMPLE 10 ROWS'
    );

    assert.strictEqual(
      Query
        .select('*')
        .from('data')
        .sample(0.3)
        .toString(),
      'SELECT * FROM "data" USING SAMPLE 30 PERCENT'
    );

    assert.strictEqual(
      Query
        .select('*')
        .from('data')
        .sample({ perc: 30 })
        .toString(),
      'SELECT * FROM "data" USING SAMPLE 30 PERCENT'
    );

    assert.strictEqual(
      Query
        .select('*')
        .from('data')
        .sample({ rows: 100, method: 'bernoulli' })
        .toString(),
      'SELECT * FROM "data" USING SAMPLE 100 ROWS (bernoulli)'
    );

    assert.strictEqual(
      Query
        .select('*')
        .from('data')
        .sample({ rows: 100, method: 'bernoulli', seed: 12345 })
        .toString(),
      'SELECT * FROM "data" USING SAMPLE 100 ROWS (bernoulli, 12345)'
    );
  });

  it('selects from multiple relations', () => {
    const sql = [
      'SELECT "a"."foo" AS "foo", "b"."bar" AS "bar"',
      'FROM "data1" AS "a", "data2" AS "b"'
    ].join(' ');

    assert.strictEqual(
      Query
        .select({
          foo: column('a', 'foo'),
          bar: column('b', 'bar')
        })
        .from({ a: 'data1', b: 'data2' })
        .toString(),
      sql
    );
  });

  it('selects from subqueries', () => {
    assert.strictEqual(
      Query
        .select('foo', 'bar')
        .from(Query.select('*').from('data'))
        .toString(),
      'SELECT "foo", "bar" FROM (SELECT * FROM "data")'
    );

    assert.strictEqual(
      Query
        .select('foo', 'bar')
        .from({ a: Query.select('*').from('data') })
        .toString(),
      'SELECT "foo", "bar" FROM (SELECT * FROM "data") AS "a"'
    );
  });

  it('selects with common table expressions', () => {
    assert.strictEqual(
      Query
        .with({ a: Query.select('*').from('data') })
        .select('foo', 'bar')
        .from('a')
        .toString(),
      'WITH "a" AS (SELECT * FROM "data") SELECT "foo", "bar" FROM "a"'
    );

    assert.strictEqual(
      Query
        .with({
          a: Query.select('foo').from('data1'),
          b: Query.select('bar').from('data2')
        })
        .select('*')
        .from('a', 'b')
        .toString(),
      [
        'WITH "a" AS (SELECT "foo" FROM "data1"),',
             '"b" AS (SELECT "bar" FROM "data2")',
        'SELECT * FROM "a", "b"'
      ].join(' ')
    );
  });
});