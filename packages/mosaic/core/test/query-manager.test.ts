import { Table, tableFromArrays } from '@uwdata/flechette';
import { describe, it, expect } from 'vitest';
import { count, Query, sum } from '@uwdata/mosaic-sql';
import { QueryManager } from '../src/QueryManager.js';
import { QueryResult } from '../src/util/query-result.js';
import { QueryRequest } from '../src/types.js';

describe('QueryManager', () => {
  it('should run a simple query', async () => {
    const queryManager = new QueryManager();

    // Mock the connector
    queryManager.connector({
      // @ts-expect-error assumes type value
      query: async ({ sql }) => {
        expect(sql).toBe('SELECT 1');
        return tableFromArrays({ column: [1] });
      }
    });

    const request: QueryRequest = {
      type: 'arrow',
      query: 'SELECT 1'
    };

    const result = queryManager.request(request);
    expect(result).toBeInstanceOf(QueryResult);

    const data = await result as Table;
    expect(data.toArray()).toEqual([{ column: 1 }]);
  });

  it('should not run a query when there is a pending exec', async () => {
    const queryManager = new QueryManager();

    // Mock the connector
    queryManager.connector({
      // @ts-expect-error assumes type value
      query: ({ sql }) => {
        expect(sql).toBe('CREATE TABLE test (id INT)');
        return new Promise(() => {});
      }
    });

    const request1: QueryRequest = {
      type: 'exec',
      query: 'CREATE TABLE test (id INT)'
    };

    const request2: QueryRequest = {
      type: 'arrow',
      query: 'SELECT * FROM test'
    };

    queryManager.request(request1);
    queryManager.request(request2);

    expect(queryManager.pendingResults).toHaveLength(1);
  });

  it('fences consolidated cache fills issued before invalidate()', async () => {
    const queryManager = new QueryManager();
    queryManager.cache(true);
    queryManager.consolidate(true);
    const cache = queryManager.cache()!;
    let resolve!: (value: unknown) => void;
    const sql: string[] = [];
    queryManager.connector({
      // @ts-expect-error assumes type value
      query: (req) => { sql.push(req.sql); return new Promise(r => { resolve = r; }); }
    });

    const q1 = Query.from('t').select({ c: count() });
    const q2 = Query.from('t').select({ c: sum('x') });
    const r1 = queryManager.request({ type: 'arrow', query: q1, cache: true });
    const r2 = queryManager.request({ type: 'arrow', query: q2, cache: true });
    await new Promise(r => setImmediate(r));
    expect(sql).toHaveLength(1);

    queryManager.invalidate();
    resolve(tableFromArrays({ col0: [1], col1: [2] }));
    expect((await r1 as Table).numRows).toBe(1);
    expect((await r2 as Table).numRows).toBe(1);
    expect(cache.get(String(q1))).toBeUndefined();
    expect(cache.get(String(q2))).toBeUndefined();
  });

  it('fences cache fills issued before invalidate()', async () => {
    const queryManager = new QueryManager();
    queryManager.cache(true);
    const cache = queryManager.cache()!;
    let resolve!: (value: unknown) => void;
    queryManager.connector({
      // @ts-expect-error assumes type value
      query: () => new Promise(r => { resolve = r; })
    });

    const result = queryManager.request({ type: 'arrow', query: 'SELECT 1', cache: true });
    await new Promise(r => setTimeout(r, 0));
    expect(cache.get('SELECT 1')).toBeInstanceOf(Promise);

    cache.set('SELECT 2', 2);
    queryManager.invalidate();
    expect(cache.get('SELECT 2')).toBeUndefined();

    resolve([{ column: 1 }]);
    expect(await result).toEqual([{ column: 1 }]);
    expect(cache.get('SELECT 1')).toBeUndefined();

    const fresh = queryManager.request({ type: 'arrow', query: 'SELECT 1', cache: true });
    await new Promise(r => setTimeout(r, 0));
    resolve([{ column: 2 }]);
    expect(await fresh).toEqual([{ column: 2 }]);
    expect(cache.get('SELECT 1')).toEqual([{ column: 2 }]);
  });
});
