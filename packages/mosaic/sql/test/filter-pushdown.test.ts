import { expect, describe, it } from 'vitest';
import { column, count, cross_join, div, eq, filterPushdown, FromClauseNode, gt, join, Query, ScalarSubqueryNode, TableRefNode } from '../src/index.js';

describe('filterPushdown', () => {
  it('does nothing given empty filter', () => {
    const q = Query.select('v').from('table');
    const f = filterPushdown(q, 'table', []);
    expect(String(f)).toMatchInlineSnapshot(`"SELECT "v" FROM "table""`);
  });

  it('does nothing given unreferenced table', () => {
    const q = Query.select('v').from('table');
    const f = filterPushdown(q, 'dont_exist', gt('x', 2));
    expect(String(f)).toMatchInlineSnapshot(`"SELECT "v" FROM "table""`);
  });

  it('updates queries', () => {
    const q = Query.select('v').from('table');
    const f = filterPushdown(q, 'table', gt('x', 2));
    expect(String(f)).toMatchInlineSnapshot(`"WITH "_table" AS (SELECT * FROM "table" WHERE ("x" > 2)) SELECT "v" FROM "_table" AS "table""`);
  });

  it('avoids namespace collisions', () => {
    const q = Query.select('v').from('table', '_table');
    const f = filterPushdown(q, 'table', gt('x', 2));
    expect(String(f)).toMatchInlineSnapshot(`"WITH "__table" AS (SELECT * FROM "table" WHERE ("x" > 2)) SELECT "v" FROM "__table" AS "table", "_table""`);
  });

  it('updates FROM subqueries', () => {
    const q = Query.select('v').from(Query.select({ v: 'x' }).from('table'));
    const f = filterPushdown(q, 'table', gt('x', 2));
    expect(String(f)).toMatchInlineSnapshot(`"WITH "_table" AS (SELECT * FROM "table" WHERE ("x" > 2)) SELECT "v" FROM (SELECT "x" AS "v" FROM "_table" AS "table")"`);
  });

  it('updates CTEs', () => {
    const q = Query
      .with({ c: Query.select({ v: 'x' }).from('table') })
      .select('v').from('c');
    const f = filterPushdown(q, 'table', gt('x', 2));
    expect(String(f)).toMatchInlineSnapshot(`"WITH "_table" AS (SELECT * FROM "table" WHERE ("x" > 2)), "c" AS (SELECT "x" AS "v" FROM "_table" AS "table") SELECT "v" FROM "c""`);
  });

  it('updates self joins', () => {
    const q = Query
      .select('*')
      .from(
        cross_join(
          new FromClauseNode(new TableRefNode('table'), 'T1'),
          new FromClauseNode(new TableRefNode('table'), 'T2')
        )
      );
    const f = filterPushdown(q, 'table', gt('x', 2));
    expect(String(f)).toMatchInlineSnapshot(`"WITH "_table" AS (SELECT * FROM "table" WHERE ("x" > 2)) SELECT * FROM "_table" AS "T1" CROSS JOIN "_table" AS "T2""`);
  });

  it('updates explicit joins', () => {
    const q = Query
      .select('*')
      .from(
        join('table', 'other', { using: ['id'] })
      );
    const f = filterPushdown(q, 'table', gt('x', 2));
    expect(String(f)).toMatchInlineSnapshot(`"WITH "_table" AS (SELECT * FROM "table" WHERE ("x" > 2)) SELECT * FROM "_table" JOIN "other" USING ("id")"`);
  });

  it('updates implicit joins', () => {
    const q = Query
      .select('a', 'b', column('v', 'O'))
      .from(
        new FromClauseNode(new TableRefNode('table'), 'T'),
        new FromClauseNode(new TableRefNode('other'), 'O'),
      )
      .where(eq(column('id', 'T'), column('id', 'O')));
    const f = filterPushdown(q, 'table', gt('x', 2));
    expect(String(f)).toMatchInlineSnapshot(`"WITH "_table" AS (SELECT * FROM "table" WHERE ("x" > 2)) SELECT "a", "b", "O"."v" AS "v" FROM "_table" AS "T", "other" AS "O" WHERE ("T"."id" = "O"."id")"`);
  });

  it('skips scalar subqueries', () => {
    const sub = new ScalarSubqueryNode(Query.select({ count: count() }).from('table'))
    const q = Query.select({ norm: div('v', sub) }).from('table');
    const f = filterPushdown(q, 'table', gt('x', 2));
    expect(String(f)).toMatchInlineSnapshot(`"WITH "_table" AS (SELECT * FROM "table" WHERE ("x" > 2)) SELECT ("v" / (SELECT count(*) AS "count" FROM "table")) AS "norm" FROM "_table" AS "table""`);
  });
});
