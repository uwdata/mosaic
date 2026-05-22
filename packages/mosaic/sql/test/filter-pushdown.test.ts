import { expect, describe, it } from 'vitest';
import { count, div, filterPushdown, gt, Query, ScalarSubqueryNode } from '../src/index.js';

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

  it('skips scalar subqueries', () => {
    const sub = new ScalarSubqueryNode(Query.select({ count: count() }).from('table'))
    const q = Query.select({ norm: div('v', sub) }).from('table');
    const f = filterPushdown(q, 'table', gt('x', 2));
    expect(String(f)).toBe('SELECT ("v" / (SELECT count(*) AS "count" FROM "table")) AS "norm" FROM "table" WHERE ("x" > 2)');
  });
});
