import { Table, tableFromArrays, tableToIPC } from '@uwdata/flechette';
import { describe, it, expect } from 'vitest';
import { count, Query, sum } from '@uwdata/mosaic-sql';
import { QueryManager } from '../src/QueryManager.js';
import { QueryResult } from '../src/util/query-result.js';
import { QueryRequest } from '../src/types.js';

describe('QueryManager', () => {
  const cachedRequest: QueryRequest = {
    type: 'arrow',
    query: 'SELECT * FROM test',
    cache: true
  };

  it('should run a simple query', async () => {
    const queryManager = new QueryManager();

    // Mock the connector
    queryManager.connector({
      // @ts-expect-error assumes type value
      query: async ({ sql }) => {
        expect(sql).toBe('SELECT 1');
        return tableToIPC(tableFromArrays({ column: [1] }), {})!;
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

  it('caches a decoded arrow result with its IPC byte length', async () => {
    const bytes = tableToIPC(tableFromArrays({ a: [1, 2, 3] }), {})!;
    const store = new Map<string, unknown>();
    const sizes: (number | undefined)[] = [];
    const queryManager = new QueryManager();
    queryManager.cache({
      get: key => store.get(key),
      set: (key, value, size) => (store.set(key, value), sizes.push(size), value),
      clear: () => store.clear(),
      bytes: () => 0
    });

    let calls = 0;
    queryManager.connector({
      // @ts-expect-error assumes type value
      query: async () => {
        calls += 1;
        return bytes;
      }
    });

    const pending = queryManager.request(cachedRequest);
    const second = queryManager.request(cachedRequest);
    const first = await pending as Table;

    expect(first.numRows).toBe(3);
    expect(await second).toBe(first);
    expect(calls).toBe(1);
    expect(sizes).toEqual([bytes.length]);
  });

  it('does not cache a rejected query', async () => {
    const bytes = tableToIPC(tableFromArrays({ a: [1] }), {})!;
    const queryManager = new QueryManager();
    queryManager.cache(true);

    let calls = 0;
    queryManager.connector({
      // @ts-expect-error assumes type value
      query: async () => {
        calls += 1;
        if (calls === 1) throw new Error('transient');
        return bytes;
      }
    });

    await expect(queryManager.request(cachedRequest)).rejects.toThrow('transient');
    const data = await queryManager.request(cachedRequest) as Table;

    expect(calls).toBe(2);
    expect(data.numRows).toBe(1);
  });

  it('drops cached results when the extraction options change', async () => {
    const bytes = tableToIPC(tableFromArrays({ a: [1] }), {})!;
    const queryManager = new QueryManager();
    queryManager.cache(true);

    let calls = 0;
    queryManager.connector({
      // @ts-expect-error assumes type value
      query: async () => {
        calls += 1;
        return bytes;
      }
    });

    await queryManager.request(cachedRequest);
    await queryManager.request(cachedRequest);
    expect(calls).toBe(1);

    queryManager.ipc({ useDate: false });
    await queryManager.request(cachedRequest);

    expect(calls).toBe(2);
  });

  it('fences consolidated cache fills issued before invalidate()', async () => {
    const queryManager = new QueryManager();
    queryManager.cache(true);
    queryManager.consolidate(true);
    const cache = queryManager.cache();
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
    resolve(tableToIPC(tableFromArrays({ col0: [1], col1: [2] }), {})!);
    expect((await r1 as Table).numRows).toBe(1);
    expect((await r2 as Table).numRows).toBe(1);
    expect(cache.get(String(q1))).toBeUndefined();
    expect(cache.get(String(q2))).toBeUndefined();
  });

  it('fences cache fills issued before invalidate()', async () => {
    const queryManager = new QueryManager();
    queryManager.cache(true);
    const cache = queryManager.cache();
    let resolve!: (value: unknown) => void;
    queryManager.connector({
      // @ts-expect-error assumes type value
      query: () => new Promise(r => { resolve = r; })
    });

    const result = queryManager.request({ type: 'arrow', query: 'SELECT 1', cache: true });
    await new Promise(r => setTimeout(r, 0));

    cache.set('SELECT 2', 2, 0);
    queryManager.invalidate();
    expect(cache.get('SELECT 2')).toBeUndefined();

    resolve(tableToIPC(tableFromArrays({ column: [1] }), {})!);
    expect((await result as Table).toArray()).toEqual([{ column: 1 }]);
    expect(cache.get('SELECT 1')).toBeUndefined();

    const fresh = queryManager.request({ type: 'arrow', query: 'SELECT 1', cache: true });
    await new Promise(r => setTimeout(r, 0));
    resolve(tableToIPC(tableFromArrays({ column: [2] }), {})!);
    const data = await fresh as Table;
    expect(data.toArray()).toEqual([{ column: 2 }]);
    expect(cache.get('SELECT 1')).toBe(data);
  });
});
