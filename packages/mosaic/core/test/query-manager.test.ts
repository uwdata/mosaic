import { Table, tableFromArrays } from '@uwdata/flechette';
import { describe, it, expect } from 'vitest';
import { QueryManager } from '../src/QueryManager.js';
import { QueryResult } from '../src/util/query-result.js';
import type { QueryRequest } from '../src/types.js';
import { EventType, MosaicQueryEndEvent, MosaicQueryStartEvent } from '../src/Events.js';

describe('QueryManager', () => {
  it('should run a simple query', async () => {
    const queryManager = new QueryManager();

    // Mock the connector
    queryManager.connector({
      // @ts-expect-error assumes type value
      query: async ({ sql }) => {
        expect(sql).toBe('SELECT 1');
        return tableFromArrays({ column: [1] });
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
      query: async () => tableFromArrays({ value: [42] })
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
        return tableFromArrays({ value: [1] });
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
});
