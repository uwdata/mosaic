import { expect, describe, it } from 'vitest';
import {
  add,
  column,
  FromClauseNode,
  isColumnRef,
  isPivotQuery,
  isQuery,
  isSelectQuery,
  isTableRef,
  PivotQuery,
  Query,
  sql
} from '../src/index.js';

describe('PivotQuery', () => {
  it('constructs a pivot query from a table name', () => {
    const query = Query.pivot('sales');

    expect(query).toBeInstanceOf(PivotQuery);
    expect(query.type).toBe('PIVOT_QUERY');
    expect(isQuery(query)).toBe(true);
    expect(isPivotQuery(query)).toBe(true);
  });

  it('identifies only pivot queries with the pivot type guard', () => {
    expect(isPivotQuery(Query.pivot('sales'))).toBe(true);
    expect(isPivotQuery(Query.select('*').from('sales'))).toBe(false);
    expect(isPivotQuery(null)).toBe(false);
    expect(isPivotQuery({ type: 'PIVOT_QUERY' })).toBe(false);
  });

  it('stores table name sources as SQL AST nodes', () => {
    const query = Query.pivot('sales');

    expect(isTableRef(query.source)).toBe(true);
    expect(`${query.source}`).toBe('"sales"');
  });

  it('accepts existing SQL nodes as pivot sources', () => {
    const source = sql`SELECT * FROM sales`;
    const query = Query.pivot(source);

    expect(query.source).toBe(source);
  });

  it('adds ON expressions from string column names', () => {
    const query = Query.pivot('sales').on('year');

    expect(query._on).toHaveLength(1);
    expect(isColumnRef(query._on[0])).toBe(true);
    expect(`${query._on[0]}`).toBe('"year"');
    expect(query.toString()).toBe('PIVOT "sales" ON "year"');
  });

  it('adds multiple ON expressions in caller-supplied order', () => {
    const query = Query.pivot('sales').on('year', 'quarter');

    expect(query._on.map(String)).toEqual(['"year"', '"quarter"']);
    expect(query.toString()).toBe('PIVOT "sales" ON "year", "quarter"');
  });

  it('adds array ON expressions in caller-supplied order', () => {
    const query = Query.pivot('sales').on(['year', 'quarter']);

    expect(query._on.map(String)).toEqual(['"year"', '"quarter"']);
    expect(query.toString()).toBe('PIVOT "sales" ON "year", "quarter"');
  });

  it('appends ON expressions from repeated calls', () => {
    const query = Query.pivot('sales').on('year').on('quarter');

    expect(query._on.map(String)).toEqual(['"year"', '"quarter"']);
    expect(query.toString()).toBe('PIVOT "sales" ON "year", "quarter"');
  });

  it('preserves existing AST expression inputs for ON expressions', () => {
    const expr = add(column('year'), 1);
    const query = Query.pivot('sales').on(expr);

    expect(query._on).toEqual([expr]);
    expect(query.toString()).toBe('PIVOT "sales" ON ("year" + 1)');
  });

  it('can be used as a select query source', () => {
    const pivot = Query.pivot('sales');
    const query = Query.select('*').from({ p: pivot });
    const [source] = query._from;

    expect(isSelectQuery(query)).toBe(true);
    expect(source).toBeInstanceOf(FromClauseNode);
    expect((source as FromClauseNode).expr).toBe(pivot);
    expect(query.toString()).toBe('SELECT * FROM (PIVOT "sales") AS "p"');
  });

  it('can be used as a select query source with pivot clauses', () => {
    const pivot = Query.pivot('sales').on('year');
    const query = Query.select('*').from({ p: pivot });
    const [source] = query._from;

    expect(isSelectQuery(query)).toBe(true);
    expect(source).toBeInstanceOf(FromClauseNode);
    expect((source as FromClauseNode).expr).toBe(pivot);
    expect(query.toString()).toBe('SELECT * FROM (PIVOT "sales" ON "year") AS "p"');
  });
});
