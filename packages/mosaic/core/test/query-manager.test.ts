import { Table, tableFromArrays, tableToIPC } from '@uwdata/flechette';
import { describe, it, expect } from 'vitest';
import { QueryManager } from '../src/QueryManager.js';
import { QueryResult } from '../src/util/query-result.js';
import type { QueryRequest } from '../src/types.js';
import { EventType, MosaicQueryEndEvent, MosaicQueryStartEvent } from '../src/Events.js';

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
      },
    });

    const request: QueryRequest = {
      type: 'arrow',
      query: 'SELECT 1',
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
      },
    });

    const request1: QueryRequest = {
      type: 'exec',
      query: 'CREATE TABLE test (id INT)',
    };

    const request2: QueryRequest = {
      type: 'arrow',
      query: 'SELECT * FROM test',
    };

    queryManager.request(request1);
    queryManager.request(request2);

    expect(queryManager.pendingResults).toHaveLength(1);
  });

  it('emits query start and end events', async () => {
    const queryManager = new QueryManager();
    const starts: MosaicQueryStartEvent[] = [];
    const ends: MosaicQueryEndEvent[] = [];
    queryManager.eventBus.addEventListener(EventType.QueryStart, event => { starts.push(event); });
    queryManager.eventBus.addEventListener(EventType.QueryEnd, event => { ends.push(event); });
    queryManager.connector({
      // @ts-expect-error assumes type value
      query: async () => tableToIPC(tableFromArrays({ value: [42] }), {})
    });

    await queryManager.request({ type: 'arrow', query: 'SELECT 42', cache: false });

    expect(starts).toHaveLength(1);
    expect(ends).toHaveLength(1);
    const [start] = starts;
    const [end] = ends;
    expect(start.type).toBe(EventType.QueryStart);
    expect(end.type).toBe(EventType.QueryEnd);
    expect(start.query).toBe('SELECT 42');
    expect(end.queryId).toBe(start.queryId);
    expect(start.cached).toBe(false);
    expect(end.status).toBe('success');
    expect(end.timestamp).toBeGreaterThanOrEqual(start.timestamp);
  });

  it('emits query start and end events for cache hits', async () => {
    const queryManager = new QueryManager();
    const ends: MosaicQueryEndEvent[] = [];
    queryManager.eventBus.addEventListener(EventType.QueryEnd, event => { ends.push(event); });
    let queryCalls = 0;
    queryManager.connector({
      // @ts-expect-error assumes type value
      query: async () => {
        queryCalls += 1;
        return tableToIPC(tableFromArrays({ value: [1] }), {});
      }
    });
    queryManager.cache(true);

    await queryManager.request({ type: 'arrow', query: 'SELECT 1', cache: true });
    await queryManager.request({ type: 'arrow', query: 'SELECT 1', cache: true });

    expect(queryCalls).toBe(1);
    expect(ends.map(event => event.queryId)).toEqual([1, 2]);
    expect(ends.every(event => event.cached && event.status === 'success')).toBe(true);
  });

  it('emits a query end event with error status when a query fails', async () => {
    const queryManager = new QueryManager();
    const ends: MosaicQueryEndEvent[] = [];
    queryManager.eventBus.addEventListener(EventType.QueryEnd, event => { ends.push(event); });
    queryManager.connector({
      query: async () => {
        throw new Error('boom');
      }
    });

    await expect(
      queryManager.request({ type: 'arrow', query: 'SELECT fail', cache: false })
    ).rejects.toThrow('boom');

    expect(ends).toHaveLength(1);
    expect(ends[0].query).toBe('SELECT fail');
    expect(ends[0].status).toBe('error');
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
});
