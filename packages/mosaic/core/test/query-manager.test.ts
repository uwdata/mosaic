import { describe, it, expect } from 'vitest';
import { Query, TableRefNode, createTable } from '@uwdata/mosaic-sql';
import { QueryManager } from '../src/QueryManager.js';
import { QueryResult, QueryState } from '../src/util/query-result.js';
import { QueryRequest } from '../src/types.js';

async function wait() {
  return new Promise<void>(resolve => setTimeout(resolve, 0));
}

interface Submitted {
  sql: string;
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}

function managerWithMockConnector(maxConcurrentRequests?: number) {
  const submitted: Submitted[] = [];
  const manager = new QueryManager(maxConcurrentRequests);
  manager.connector({
    // @ts-expect-error mock connector
    query: ({ sql }: { sql: string }) => new Promise((resolve, reject) => {
      submitted.push({ sql, resolve, reject });
    })
  });
  return { manager, submitted };
}

const preaggTable = new TableRefNode(['mosaic', 'preagg_1']);

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
      type: 'arrow',
      query: 'SELECT 1'
    };

    const result = queryManager.request(request);
    expect(result).toBeInstanceOf(QueryResult);

    const data = await result;
    expect(data).toEqual([{ column: 1 }]);
  });

  it('sends a read while an exec writes a different table', () => {
    const { manager, submitted } = managerWithMockConnector();

    manager.request({ type: 'exec', query: createTable(preaggTable, Query.select('a').from('base')) });
    manager.request({ type: 'arrow', query: Query.select('x').from('other') });

    expect(submitted).toHaveLength(2);
  });

  it('holds a read until the exec writing its table returns', async () => {
    const { manager, submitted } = managerWithMockConnector();

    manager.request({ type: 'exec', query: createTable(preaggTable, Query.select('a').from('base')) });
    const read = manager.request({ type: 'arrow', query: Query.select('a').from(preaggTable) });
    expect(submitted).toHaveLength(1);

    submitted[0].resolve();
    await wait();
    expect(submitted).toHaveLength(2);

    submitted[1].resolve([{ a: 1 }]);
    expect(await read).toEqual([{ a: 1 }]);
  });

  it('serializes writes to the same table and parallelizes writes to different tables', async () => {
    const { manager, submitted } = managerWithMockConnector();
    const create = (name: string) => manager.request({
      type: 'exec',
      query: createTable(new TableRefNode(['mosaic', name]), Query.select('a').from('base'))
    });

    create('t1');
    create('t1');
    create('t2');
    expect(submitted).toHaveLength(2);

    submitted[0].resolve();
    await wait();
    expect(submitted).toHaveLength(3);
  });

  it('treats a raw SQL exec as a barrier', () => {
    const { manager, submitted } = managerWithMockConnector();

    manager.request({ type: 'exec', query: 'CREATE TABLE test (id INT)' });
    manager.request({ type: 'arrow', query: Query.select('x').from('other') });
    manager.request({ type: 'exec', query: createTable(preaggTable, Query.select('a').from('base')) });

    expect(submitted).toHaveLength(1);
  });

  it('holds a raw SQL read behind any exec, but not behind other reads', () => {
    const { manager, submitted } = managerWithMockConnector();

    manager.request({ type: 'arrow', query: Query.select('x').from('other') });
    manager.request({ type: 'arrow', query: 'SELECT 1 FROM t' });
    expect(submitted).toHaveLength(2);

    manager.request({ type: 'exec', query: createTable(preaggTable, Query.select('a').from('base')) });
    manager.request({ type: 'arrow', query: 'SELECT 2 FROM t' });
    expect(submitted).toHaveLength(3);
  });

  it('releases reads held behind a canceled write', async () => {
    const { manager, submitted } = managerWithMockConnector();
    const create = () => manager.request({
      type: 'exec',
      query: createTable(preaggTable, Query.select('a').from('base'))
    });

    create();
    const queued = create();
    queued.catch(() => {});
    manager.request({ type: 'arrow', query: Query.select('a').from(preaggTable) });
    expect(submitted).toHaveLength(1);

    manager.cancel([queued]);
    submitted[0].resolve();
    await wait();
    expect(submitted.map(s => s.sql.split(' ')[0])).toEqual(['CREATE', 'SELECT']);
  });

  it('limits the number of concurrent requests', async () => {
    const queryManager = new QueryManager(2);
    const resolvers: ((value: unknown) => void)[] = [];

    queryManager.connector({
      query: () => new Promise(resolve => resolvers.push(resolve))
    });

    const results = [0, 1, 2].map(i =>
      queryManager.request({ type: 'arrow', query: `SELECT ${i}` })
    );
    expect(resolvers).toHaveLength(2);

    resolvers[0]([]);
    await results[0];
    await wait();
    expect(resolvers).toHaveLength(3);
  });

  it('resolves results as they complete', async () => {
    const queryManager = new QueryManager();
    const resolvers: ((value: unknown) => void)[] = [];

    queryManager.connector({
      query: () => new Promise(resolve => resolvers.push(resolve))
    });

    const first = queryManager.request({ type: 'arrow', query: 'SELECT 0' });
    const second = queryManager.request({ type: 'arrow', query: 'SELECT 1' });

    resolvers[1]([1]);
    expect(await second).toEqual([1]);
    expect(first.state).toBe(QueryState.pending);
  });
});
