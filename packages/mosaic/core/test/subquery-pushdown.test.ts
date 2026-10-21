import { describe, it, expect } from 'vitest';
import { Query, ScalarSubqueryNode, TableRefNode, cast, column, columns, cross_join, star, count, FromClauseNode, gt, join, least, sql, sum } from '@uwdata/mosaic-sql';
import { subqueryPushdown } from '../src/preagg/subquery-pushdown.js';

function pushdown(query: Query, source: string | string[], cols: string[]) {
  subqueryPushdown(query, new TableRefNode(source), cols);
  return `${query}`;
}

describe('subqueryPushdown', () => {
  it('pushes columns into an aggregate query over the source', () => {
    const q = Query
      .select('category', { sum: sum('value') })
      .from('data')
      .groupby('category');
    expect(pushdown(q, 'data', ['other'])).toBe(
      'SELECT "category", sum("value") AS "sum", "other" FROM "data" GROUP BY "category", "other"'
    );
  });

  it('matches existing columns case-insensitively', () => {
    const q = Query
      .select('Category', { sum: sum('value') })
      .from('data')
      .groupby('Category');
    expect(pushdown(q, 'data', ['category'])).toBe(
      'SELECT "Category", sum("value") AS "sum" FROM "data" GROUP BY "Category"'
    );
    const s = Query.select(star(null, { exclude: ['A'] })).from('data');
    expect(pushdown(s, 'data', ['a'])).toBe(
      'SELECT * EXCLUDE ("A"), "a" FROM "data"'
    );
  });

  it('does not duplicate existing columns', () => {
    const q = Query
      .select('category', 'other', { sum: sum('value') })
      .from('data')
      .groupby('category', 'other');
    expect(pushdown(q, 'data', ['other'])).toBe(
      'SELECT "category", "other", sum("value") AS "sum" FROM "data" GROUP BY "category", "other"'
    );
  });

  it('does not add a group by to non-aggregate queries', () => {
    const q = Query.select('x').from('data');
    expect(pushdown(q, 'data', ['a'])).toBe('SELECT "x", "a" FROM "data"');
  });

  it('does not add select columns to star queries', () => {
    const q = Query.select('*').from('data');
    expect(pushdown(q, 'data', ['a'])).toBe('SELECT * FROM "data"');
  });

  it('adds columns removed by star modifiers', () => {
    const q = Query
      .select(star(null, { exclude: ['a'], rename: { b: 'b2' }, replace: { c: sql`c + 1` } }))
      .from('data');
    expect(pushdown(q, 'data', ['a', 'b', 'c', 'd'])).toBe(
      'SELECT * EXCLUDE ("a") REPLACE (c + 1 AS "c") RENAME ("b" AS "b2"), "a", "b" FROM "data"'
    );
  });

  it('does not add select columns to COLUMNS queries', () => {
    const q = Query.select(columns('^[ab]$')).from('data');
    expect(pushdown(q, 'data', ['a'])).toBe('SELECT COLUMNS(\'^[ab]$\') FROM "data"');
  });

  it('leaves queries over other tables unchanged', () => {
    const q = Query.select('x').from('other');
    expect(pushdown(q, 'data', ['a'])).toBe('SELECT "x" FROM "other"');
  });

  it('matches schema-qualified source tables', () => {
    const q = Query.select('x').from(new TableRefNode(['main', 'data']));
    expect(pushdown(q, ['main', 'data'], ['a'])).toBe(
      'SELECT "x", "a" FROM "main"."data"'
    );
  });

  it('pushes columns through CTEs and set operations', () => {
    const q = Query
      .with({
        values: Query.unionAll(
          Query
            .select({ raw_value: cast('initial_tokens', 'DOUBLE'), round: sql`'Initial'` })
            .from('Eval_Runs')
            .where(gt('initial_tokens', 0)),
          Query
            .select({ raw_value: cast('total_tokens', 'DOUBLE'), round: sql`'Final'` })
            .from('Eval_Runs')
            .where(gt('total_tokens', 0))
        ),
        capped: Query
          .select('raw_value', 'round', { p95: sql`quantile_cont("raw_value", 0.95) OVER ()` })
          .from('values')
      })
      .select({ input_tokens: least('raw_value', 'p95') }, 'round')
      .from('capped');
    expect(pushdown(q, 'Eval_Runs', ['sweep', 'analytical'])).toBe(
      'WITH "values" AS (SELECT ("initial_tokens")::DOUBLE AS "raw_value", \'Initial\' AS "round", "sweep", "analytical" FROM "Eval_Runs" WHERE ("initial_tokens" > 0) UNION ALL SELECT ("total_tokens")::DOUBLE AS "raw_value", \'Final\' AS "round", "sweep", "analytical" FROM "Eval_Runs" WHERE ("total_tokens" > 0)), "capped" AS (SELECT "raw_value", "round", quantile_cont("raw_value", 0.95) OVER () AS "p95", "sweep", "analytical" FROM "values") SELECT least("raw_value", "p95") AS "input_tokens", "round", "sweep", "analytical" FROM "capped"'
    );
  });

  it('skips CTEs not on a lineage path to the source', () => {
    const q = Query
      .with({
        a: Query.select('x').from('data'),
        b: Query.select('y').from('other'),
        unused: Query.select('z').from('data')
      })
      .select('x', 'y')
      .from('a', 'b');
    expect(pushdown(q, 'data', ['c'])).toBe(
      'WITH "a" AS (SELECT "x", "c" FROM "data"), "b" AS (SELECT "y" FROM "other"), "unused" AS (SELECT "z" FROM "data") SELECT "x", "y", "a"."c" AS "c" FROM "a", "b"'
    );
  });

  it('respects CTE shadowing of the source table', () => {
    const q = Query
      .with({ data: Query.select('x').from('other') })
      .select('x')
      .from('data');
    expect(pushdown(q, 'data', ['c'])).toBe(
      'WITH "data" AS (SELECT "x" FROM "other") SELECT "x" FROM "data"'
    );
  });

  it('resolves nested CTEs by scope', () => {
    const inner = Query
      .with({ t: Query.select('x').from('data') })
      .select('x')
      .from('t');
    const q = Query
      .with({ t: Query.select('x').from('other') })
      .select('x')
      .from(inner, 't');
    expect(pushdown(q, 'data', ['c'])).toBe(
      'WITH "t" AS (SELECT "x" FROM "other") SELECT "x", "c" FROM (WITH "t" AS (SELECT "x", "c" FROM "data") SELECT "x", "c" FROM "t"), "t"'
    );
  });

  it('pushes columns through FROM subqueries', () => {
    const q = Query
      .select({ n: count() })
      .from(Query.select('x').from('data').where(gt('x', 0)));
    expect(pushdown(q, 'data', ['c'])).toBe(
      'SELECT count(*) AS "n", "c" FROM (SELECT "x", "c" FROM "data" WHERE ("x" > 0)) GROUP BY "c"'
    );
  });

  it('pushes columns through join inputs', () => {
    const q = Query
      .select('x', 'y')
      .from(join(
        new FromClauseNode(Query.select('x', 'k').from('data'), 'l'),
        new FromClauseNode(Query.select('y', 'k').from('other'), 'r'),
        { using: ['k'] }
      ));
    expect(pushdown(q, 'data', ['c'])).toBe(
      'SELECT "x", "y", "l"."c" AS "c" FROM (SELECT "x", "k", "c" FROM "data") AS "l" JOIN (SELECT "y", "k" FROM "other") AS "r" USING ("k")'
    );
  });

  it('applies table-qualified star modifiers only to their tables', () => {
    const q = (exclude: string) => Query
      .select(star(null, { exclude: [column('num1', exclude)] }))
      .from(cross_join('t1', 't2'));
    expect(pushdown(q('t2'), 't1', ['num1'])).toBe(
      'SELECT * EXCLUDE ("t2"."num1") FROM "t1" CROSS JOIN "t2"'
    );
    expect(pushdown(q('t1'), 't1', ['num1'])).toBe(
      'SELECT * EXCLUDE ("t1"."num1"), "t1"."num1" AS "num1" FROM "t1" CROSS JOIN "t2"'
    );
  });

  it('matches star modifier qualifiers by schema', () => {
    const q = (exclude: string[]) => Query
      .select(star(null, { exclude: [column('a', exclude)] }))
      .from(cross_join(['s1', 't'], ['s2', 't']));
    const from = 'FROM "s1"."t" CROSS JOIN "s2"."t"';
    expect(pushdown(q(['s2', 't']), ['s1', 't'], ['a'])).toBe(
      `SELECT * EXCLUDE ("s2"."t"."a") ${from}`
    );
    expect(pushdown(q(['s1', 't']), ['s1', 't'], ['a'])).toBe(
      `SELECT * EXCLUDE ("s1"."t"."a"), "s1"."t"."a" AS "a" ${from}`
    );
    expect(pushdown(q(['t']), ['s1', 't'], ['a'])).toBe(
      `SELECT * EXCLUDE ("t"."a"), "s1"."t"."a" AS "a" ${from}`
    );
  });

  it('matches star modifier qualifiers case-insensitively', () => {
    const q = Query
      .select(star(null, { exclude: [column('num1', 'T1')] }))
      .from(cross_join('t1', 't2'));
    expect(pushdown(q, 't1', ['num1'])).toBe(
      'SELECT * EXCLUDE ("T1"."num1"), "t1"."num1" AS "num1" FROM "t1" CROSS JOIN "t2"'
    );
  });

  it('treats an alias matching the table name case-insensitively as implicit', () => {
    const q = Query
      .select(star(null, { exclude: [column('a', ['s2', 't'])] }))
      .from(cross_join(new FromClauseNode(new TableRefNode(['s1', 't']), 'T'), ['s2', 't']));
    expect(pushdown(q, ['s1', 't'], ['a'])).toBe(
      'SELECT * EXCLUDE ("s2"."t"."a") FROM "s1"."t" AS "T" CROSS JOIN "s2"."t"'
    );
  });

  it('matches star modifier qualifiers against aliases', () => {
    const q = Query
      .select(star(null, { exclude: [column('a', 't')] }))
      .from(join(new FromClauseNode(new TableRefNode('t'), 'x'), 't', { using: ['k'] }));
    expect(pushdown(q, 't', ['a'])).toBe(
      'SELECT * EXCLUDE ("t"."a"), "a" FROM "t" AS "x" JOIN "t" USING ("k")'
    );
  });

  it('adds columns not output by table-qualified stars', () => {
    const q = Query.select(star('t2')).from(cross_join('t1', 't2'));
    expect(pushdown(q, 't1', ['num1'])).toBe(
      'SELECT "t2".*, "t1"."num1" AS "num1" FROM "t1" CROSS JOIN "t2"'
    );
  });

  it('qualifies columns pushed into aggregate joins', () => {
    const q = Query
      .select({ n: count() })
      .from(cross_join('t1', 't2'))
      .groupby(column('num1', 't2'));
    expect(pushdown(q, 't1', ['num1'])).toBe(
      'SELECT count(*) AS "n", "t1"."num1" AS "num1" FROM "t1" CROSS JOIN "t2" GROUP BY "t2"."num1", "t1"."num1"'
    );
  });

  it('pads set operation inputs not derived from the source', () => {
    const q = Query.unionAll(
      Query.select('x').from('data'),
      Query.select('x').from('other')
    );
    expect(pushdown(q, 'data', ['c'])).toBe(
      'SELECT "x", "c" FROM "data" UNION ALL SELECT "x", NULL AS "c" FROM "other"'
    );
  });

  it('aligns set operation inputs by position', () => {
    const q = Query.unionAll(
      Query.select({ s: 'a', v: 'x' }).from('data'),
      Query.select('b', 'y').from('data'),
      Query.select('c', 'z').from('other')
    );
    expect(pushdown(q, 'data', ['a', 'y'])).toBe(
      'SELECT "a" AS "s", "x" AS "v", "a", "y" FROM "data" UNION ALL SELECT "b", "y", "a", "y" FROM "data" UNION ALL SELECT "c", "z", NULL AS "a", NULL AS "y" FROM "other"'
    );
  });

  it('ignores scalar subqueries', () => {
    const q = Query
      .select('x', { m: new ScalarSubqueryNode(Query.select({ m: sum('y') }).from('data')) })
      .from('other');
    expect(pushdown(q, 'data', ['c'])).toBe(
      'SELECT "x", (SELECT sum("y") AS "m" FROM "data") AS "m" FROM "other"'
    );
  });
});
