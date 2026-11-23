import { describe, it, expect } from 'vitest';
import { Query, TableRefNode, column, createSchema, createTable, loadParquet, sql } from '@uwdata/mosaic-sql';
import { intersects, queryTables, union } from '../src/util/query-tables.js';
import type { QueryRequest } from '../src/types.js';

const arrow = (query: QueryRequest['query']) => queryTables({ type: 'arrow', query });
const exec = (query: QueryRequest['query']) => queryTables({ type: 'exec', query });

describe('queryTables', () => {
  it('reads the tables in from clauses, joins, and subqueries', () => {
    const outer = Query.from({ sub: Query.from('inner').select('x') }).select('x');
    expect(arrow(outer).reads).toEqual(new Set(['inner']));
    expect(arrow(Query.from('a', 'b').select('x')).reads).toEqual(new Set(['a', 'b']));
  });

  it('ignores table qualifiers on column references', () => {
    const query = Query.from('a').select({ x: column('x', 'a') });
    expect(arrow(query).reads).toEqual(new Set(['a']));
  });

  it('keys tables by their unqualified, lowercased name', () => {
    const query = Query.from(new TableRefNode(['Schema', 'Table'])).select('x');
    expect(arrow(query).reads).toEqual(new Set(['table']));
  });

  it('reads nothing for a query without tables', () => {
    expect(arrow(Query.select({ x: sql`1 + 1` }))).toEqual({ reads: new Set(), writes: new Set() });
  });

  it('reads no table from a table function', () => {
    expect(arrow(Query.from(sql`read_parquet('f.parquet')`).select('x')).reads).toEqual(new Set());
  });

  it('marks reads unknown for verbatim text that may read a table', () => {
    const query = Query.from('a').select({ m: sql`(SELECT max(x) FROM b)` });
    expect(arrow(query).reads).toBeNull();
  });

  it('reads through a describe query', () => {
    expect(arrow(Query.describe(Query.from('t').select('x'))).reads).toEqual(new Set(['t']));
  });

  it('writes the created table and reads its source', () => {
    const create = createTable('t', Query.from('base').select('x'));
    expect(exec(create)).toEqual({ reads: new Set(['base']), writes: new Set(['t']) });
  });

  it('reads no table for a file load', () => {
    const load = loadParquet('t', 'data/t.parquet', { where: 'x > 1' });
    expect(exec(load)).toEqual({ reads: new Set(), writes: new Set(['t']) });
  });

  it('marks reads unknown for a create from a SQL string', () => {
    expect(exec(createTable('t', 'SELECT * FROM base'))).toEqual({ reads: null, writes: new Set(['t']) });
  });

  it('touches no tables for a schema create', () => {
    expect(exec(createSchema('s'))).toEqual({ reads: new Set(), writes: new Set() });
  });

  it('marks a raw SQL exec unknown for reads and writes', () => {
    expect(exec('CREATE TABLE t AS SELECT 1')).toEqual({ reads: null, writes: null });
    expect(arrow('SELECT 1 FROM t')).toEqual({ reads: null, writes: new Set() });
  });

  it('combines the tables of an array of queries', () => {
    const queries = [createTable('t', Query.from('a').select('x')), Query.from('b').select('y')];
    expect(exec(queries)).toEqual({ reads: new Set(['a', 'b']), writes: new Set(['t']) });
  });
});

describe('table sets', () => {
  it('treats null as every table', () => {
    expect(union(new Set(['a']), null)).toBeNull();
    expect(union(new Set(['a']), new Set(['b']))).toEqual(new Set(['a', 'b']));
    expect(intersects(null, new Set(['a']))).toBe(true);
    expect(intersects(null, new Set())).toBe(false);
    expect(intersects(null, null)).toBe(true);
    expect(intersects(new Set(['a']), new Set(['b']))).toBe(false);
    expect(intersects(new Set(['a']), new Set(['a']))).toBe(true);
  });
});
