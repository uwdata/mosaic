import { describe, it, expect } from 'vitest';
import { Query, TableRefNode, add, column, count, join, mul, sql, sum } from '@uwdata/mosaic-sql';
import { baseExpression, baseTable } from '../src/preagg/lineage.js';

describe('baseTable', () => {
  it('finds a directly queried table', () => {
    expect(`${baseTable(Query.select('x').from('data'))}`).toBe('"data"');
  });

  it('preserves schema qualifiers', () => {
    const q = Query.select('x').from(new TableRefNode(['main', 'data']));
    expect(`${baseTable(q)}`).toBe('"main"."data"');
  });

  it('finds tables through CTEs, subqueries, and set operations', () => {
    const q = Query
      .with({
        a: Query.unionAll(
          Query.select('x').from('data'),
          Query.select('x').from('data')
        ),
        b: Query.select('x').from('a')
      })
      .select('x')
      .from(Query.select('x').from('b'));
    expect(`${baseTable(q)}`).toBe('"data"');
  });

  it('respects CTE shadowing and scope', () => {
    const shadow = Query
      .with({ data: Query.select('x').from('other') })
      .select('x')
      .from('data');
    expect(`${baseTable(shadow)}`).toBe('"other"');

    const self = Query
      .with({ data: Query.select('x').from('data') })
      .select('x')
      .from('data');
    expect(`${baseTable(self)}`).toBe('"data"');
  });

  it('returns null for multiple or unsupported sources', () => {
    expect(baseTable(Query.unionAll(
      Query.select('x').from('data'),
      Query.select('x').from('other')
    ))).toBe(null);
    expect(baseTable(Query.select('x').from('data', 'other'))).toBe(null);
    expect(baseTable(Query.select('x').from(join('data', 'other')))).toBe(null);
    expect(baseTable(Query.select({ one: sql`1` }))).toBe(null);
  });
});

describe('baseExpression', () => {
  it('returns expressions over a base table unchanged', () => {
    const q = Query.select('x').from('data');
    expect(`${baseExpression(q, column('x'))}`).toBe('"x"');
  });

  it('resolves column aliases through CTEs and subqueries', () => {
    const q = Query
      .with({ a: Query.select({ u: mul('x', 2) }).from('data') })
      .select('v')
      .from(Query.select({ v: add('u', 1), w: 'u' }).from('a'));
    expect(`${baseExpression(q, column('v'))}`).toBe('(("x" * 2) + 1)');
    expect(`${baseExpression(q, add('v', 'w'))}`).toBe('((("x" * 2) + 1) + ("x" * 2))');
  });

  it('passes columns through star selections', () => {
    const q = Query.select('x').from(Query.select('*').from('data'));
    expect(`${baseExpression(q, column('x'))}`).toBe('"x"');
  });

  it('resolves set operations with matching expressions', () => {
    const q = Query.select('v').from(Query.unionAll(
      Query.select({ v: 'x' }).from('data'),
      Query.select({ v: 'x' }).from('data')
    ));
    expect(`${baseExpression(q, column('v'))}`).toBe('"x"');

    const mismatch = Query.select('v').from(Query.unionAll(
      Query.select({ v: 'x' }).from('data'),
      Query.select({ v: 'y' }).from('data')
    ));
    expect(baseExpression(mismatch, column('v'))).toBe(undefined);
  });

  it('does not resolve aggregate, window, or missing columns', () => {
    const agg = Query
      .select('n')
      .from(Query.select({ n: count() }).from('data'));
    expect(baseExpression(agg, column('n'))).toBe(undefined);

    const win = Query
      .select('s')
      .from(Query.select({ s: sum('x').window() }).from('data'));
    expect(baseExpression(win, column('s'))).toBe(undefined);

    const missing = Query.select('z').from(Query.select('x').from('data'));
    expect(baseExpression(missing, column('z'))).toBe(undefined);
  });
});
