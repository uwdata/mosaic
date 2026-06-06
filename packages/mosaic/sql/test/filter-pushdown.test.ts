import { expect, describe, it } from 'vitest';
import { column, count, div, eq, filterPushdown, FromClauseNode, gt, Query, ScalarSubqueryNode, TableRefNode } from '../src/index.js';

describe('filterPushdown', () => {
  it('updates queries', () => {
    const q = Query.select('v').from('table');
    const f = filterPushdown(q, 'table', gt('x', 2));
    expect(String(f)).toBe('SELECT "v" FROM "table" WHERE ("x" > 2)');
  });

  it('updates subqueries', () => {
    const q = Query.select('v').from(Query.select({ v: 'x' }).from('table'));
    const f = filterPushdown(q, 'table', gt('x', 2));
    expect(String(f)).toBe('SELECT "v" FROM (SELECT "x" AS "v" FROM "table" WHERE ("x" > 2))');
  });

  it('updates CTEs', () => {
    const q = Query
      .with({ c: Query.select({ v: 'x' }).from('table') })
      .select('v').from('c');
    const f = filterPushdown(q, 'table', gt('x', 2));
    expect(String(f)).toBe('WITH "c" AS (SELECT "x" AS "v" FROM "table" WHERE ("x" > 2)) SELECT "v" FROM "c"');
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
    expect(String(f)).toBe('SELECT "a", "b", "O"."v" AS "v" FROM "table" AS "T", "other" AS "O" WHERE ("T"."id" = "O"."id") AND ("x" > 2)');
  });

  it('skips scalar subqueries', () => {
    const sub = new ScalarSubqueryNode(Query.select({ count: count() }).from('table'))
    const q = Query.select({ norm: div('v', sub) }).from('table');
    const f = filterPushdown(q, 'table', gt('x', 2));
    expect(String(f)).toBe('SELECT ("v" / (SELECT count(*) AS "count" FROM "table")) AS "norm" FROM "table" WHERE ("x" > 2)');
  });
});
