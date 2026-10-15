import { describe, it, expect } from 'vitest';
import { Query, TableRefNode, add, column, columns, count, join, mul, sql, star, sum } from '@uwdata/mosaic-sql';
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

  it('resolves columns through star modifiers', () => {
    const sub = Query.select(star(null, {
      exclude: ['a'],
      replace: { b: mul('b', 2) },
      rename: { c: 'd' }
    })).from('data');
    const q = (name: string) => baseExpression(Query.select(name).from(sub), column(name));
    expect(`${q('x')}`).toBe('"x"');
    expect(`${q('b')}`).toBe('("b" * 2)');
    expect(`${q('d')}`).toBe('"c"');
    expect(q('a')).toBe(undefined);
    expect(q('c')).toBe(undefined);
  });

  it('does not resolve COLUMNS expressions over subqueries', () => {
    const sub = Query.select('x').from('data');
    expect(baseExpression(Query.select('x').from(sub), columns(['x']))).toBe(undefined);

    const base = Query.select('x').from('data');
    expect(`${baseExpression(base, columns(['x']))}`).toBe('COLUMNS([\'x\'])');

    const expand = Query.select('x').from(Query.select(columns('^x$')).from('data'));
    expect(baseExpression(expand, column('x'))).toBe(undefined);
  });

  it('does not resolve set operation inputs by position after a wildcard', () => {
    const q = Query.select('v').from(Query.unionAll(
      Query.select({ v: 'x' }).from('data'),
      Query.select(columns(['x'])).from('data')
    ));
    expect(baseExpression(q, column('v'))).toBe(undefined);
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

  it('resolves set operation inputs by position', () => {
    const q = Query.select('v').from(Query.unionAll(
      Query.select({ v: 'x' }).from('data'),
      Query.select('x').from('data'),
      Query.select({ w: 'x' }).from('data')
    ));
    expect(`${baseExpression(q, column('v'))}`).toBe('"x"');

    const swapped = Query.select('v').from(Query.unionAll(
      Query.select({ v: 'x', w: 'y' }).from('data'),
      Query.select({ w: 'y', v: 'x' }).from('data')
    ));
    expect(baseExpression(swapped, column('v'))).toBe(undefined);

    const nested = Query.select('v').from(Query.unionAll(
      Query.unionAll(
        Query.select({ u: 'y', v: 'x' }).from('data'),
        Query.select('y', 'x').from('data')
      ),
      Query.select('z', 'x').from('data')
    ));
    expect(`${baseExpression(nested, column('v'))}`).toBe('"x"');
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
