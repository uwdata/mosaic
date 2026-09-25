import { describe, it, expect } from 'vitest';
import { Query, ScalarSubqueryNode, TableRefNode, cast, count, FromClauseNode, gt, join, least, sql, sum } from '@uwdata/mosaic-sql';
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
      'WITH "a" AS (SELECT "x", "c" FROM "data"), "b" AS (SELECT "y" FROM "other"), "unused" AS (SELECT "z" FROM "data") SELECT "x", "y", "c" FROM "a", "b"'
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
      'SELECT "x", "y", "c" FROM (SELECT "x", "k", "c" FROM "data") AS "l" JOIN (SELECT "y", "k" FROM "other") AS "r" USING ("k")'
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

  it('ignores scalar subqueries', () => {
    const q = Query
      .select('x', { m: new ScalarSubqueryNode(Query.select({ m: sum('y') }).from('data')) })
      .from('other');
    expect(pushdown(q, 'data', ['c'])).toBe(
      'SELECT "x", (SELECT sum("y") AS "m" FROM "data") AS "m" FROM "other"'
    );
  });
});
