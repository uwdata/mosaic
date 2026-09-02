import { Table, tableFromArrays, tableToIPC } from '@uwdata/flechette';
import { describe, it, expect } from 'vitest';
import { QueryManager } from '../src/QueryManager.js';
import { QueryResult } from '../src/util/query-result.js';
import { Cache, QueryRequest } from '../src/types.js';
import { jsonByteLength } from '../src/util/cache.js';

interface CacheWrite {
  key: string;
  value: unknown;
  bytes?: number;
}

function recordingCache(writes: CacheWrite[]): Cache {
  return {
    get: () => undefined,
    set: (key, value, bytes) => {
      writes.push({ key, value, bytes });
      return value;
    },
    clear: () => {}
  };
}

describe('QueryManager', () => {
  it('should run a simple query', async () => {
    const queryManager = new QueryManager();

    // Mock the connector
    queryManager.connector({
      // @ts-expect-error assumes type value
      query: async ({ sql }) => {
        expect(sql).toBe('SELECT 1');
        return [{ column: 1 }];
      }
    });

    const request: QueryRequest = {
      type: 'json',
      query: 'SELECT 1'
    };

    const result = queryManager.request(request);
    expect(result).toBeInstanceOf(QueryResult);

    const data = await result;
    expect(data).toEqual([{ column: 1 }]);
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
      type: 'json',
      query: 'SELECT * FROM test'
    };

    queryManager.request(request1);
    queryManager.request(request2);

    expect(queryManager.pendingResults).toHaveLength(1);
  });

  it('caches an arrow result with its IPC byte length', async () => {
    const bytes = tableToIPC(tableFromArrays({ a: [1, 2, 3] }), {})!;
    const writes: CacheWrite[] = [];
    const queryManager = new QueryManager();
    queryManager.cache(recordingCache(writes));

    // @ts-expect-error assumes type value
    queryManager.connector({ query: async () => bytes });

    const table = await queryManager.request({
      type: 'arrow',
      query: 'SELECT * FROM test',
      cache: true
    }) as Table;

    expect(table.numRows).toBe(3);
    expect(writes).toHaveLength(2);
    expect(writes[0].value).toBeInstanceOf(Promise);
    expect(writes[0].bytes).toBeUndefined();
    expect(writes[1].value).toBe(table);
    expect(writes[1].bytes).toBe(bytes.length);
  });

  it('caches a json result with its JSON byte length', async () => {
    const rows = [{ a: 1 }, { a: 2 }];
    const writes: CacheWrite[] = [];
    const queryManager = new QueryManager();
    queryManager.cache(recordingCache(writes));

    // @ts-expect-error assumes type value
    queryManager.connector({ query: async () => rows });

    const data = await queryManager.request({
      type: 'json',
      query: 'SELECT * FROM test',
      cache: true
    });

    expect(data).toBe(rows);
    expect(writes[1].bytes).toBe(jsonByteLength(rows));
  });

  it('serves a cached arrow result as a decoded table', async () => {
    const bytes = tableToIPC(tableFromArrays({ a: [1, 2, 3] }), {})!;
    const store = new Map<string, unknown>();
    const queryManager = new QueryManager();
    queryManager.cache({
      get: key => store.get(key),
      set: (key, value) => (store.set(key, value), value),
      clear: () => store.clear()
    });

    let calls = 0;
    queryManager.connector({
      // @ts-expect-error assumes type value
      query: async () => {
        calls += 1;
        return bytes;
      }
    });

    const request: QueryRequest = {
      type: 'arrow',
      query: 'SELECT * FROM test',
      cache: true
    };
    const first = await queryManager.request(request) as Table;
    const second = await queryManager.request(request) as Table;

    expect(calls).toBe(1);
    expect(second).toBeInstanceOf(Table);
    expect(second).toBe(first);
    expect(second.numRows).toBe(3);
  });
});
