import { Table, tableFromArrays, tableToIPC } from '@uwdata/flechette';
import { describe, it, expect } from 'vitest';
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

  it('caches a decoded arrow result with its IPC byte length', async () => {
    const bytes = tableToIPC(tableFromArrays({ a: [1, 2, 3] }), {})!;
    const store = new Map<string, unknown>();
    const sizes: (number | undefined)[] = [];
    const queryManager = new QueryManager();
    queryManager.cache({
      get: key => store.get(key),
      set: (key, value, size) => (store.set(key, value), sizes.push(size), value),
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
    const second = await queryManager.request(request);

    expect(first.numRows).toBe(3);
    expect(second).toBe(first);
    expect(calls).toBe(1);
    expect(sizes).toEqual([undefined, bytes.length]);
  });
});
