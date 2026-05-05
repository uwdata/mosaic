import { expect, describe, it } from 'vitest';
import {
  FromClauseNode,
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

  it('can be used as a select query source', () => {
    const pivot = Query.pivot('sales');
    const query = Query.select('*').from({ p: pivot });
    const [source] = query._from;

    expect(isSelectQuery(query)).toBe(true);
    expect(source).toBeInstanceOf(FromClauseNode);
    expect((source as FromClauseNode).expr).toBe(pivot);
    expect(query.toString()).toBe('SELECT * FROM (PIVOT "sales") AS "p"');
  });
});
