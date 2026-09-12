import { Table, tableFromArrays, tableToIPC } from '@uwdata/flechette';
import { describe, it, expect } from 'vitest';
import { Query, TableRefNode, createTable } from '@uwdata/mosaic-sql';
import { QueryManager } from '../src/QueryManager.js';
import { QueryRequest } from '../src/types.js';
import { heldConnector } from './util/held-connector.js';

async function wait() {
  return new Promise<void>(resolve => setTimeout(resolve, 0));
}

function managerWithMockConnector(maxConcurrentRequests?: number) {
  const { connector, requests } = heldConnector();
  const manager = new QueryManager(maxConcurrentRequests);
  manager.connector(connector);
  return { manager, submitted: requests };
}

const preaggTable = new TableRefNode(['mosaic', 'preagg_1']);

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
    expect(result).toBeInstanceOf(Promise);

    const data = await result as Table;
    expect(data.toArray()).toEqual([{ column: 1 }]);
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

    submitted[1].resolve(tableToIPC(tableFromArrays({ a: [1] }), {})!);
    expect((await read as Table).toArray()).toEqual([{ a: 1 }]);
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
    const { manager, submitted } = managerWithMockConnector(2);

    const results = [0, 1, 2].map(i =>
      manager.request({ type: 'arrow', query: `SELECT ${i}` })
    );
    expect(submitted).toHaveLength(2);

    submitted[0].resolve([]);
    await results[0];
    await wait();
    expect(submitted).toHaveLength(3);
  });

  it('resolves results as they complete', async () => {
    const { manager, submitted } = managerWithMockConnector();

    const first = manager.request({ type: 'arrow', query: 'SELECT 0' });
    const second = manager.request({ type: 'arrow', query: 'SELECT 1' });

    submitted[1].resolve(tableToIPC(tableFromArrays({ a: [1] }), {})!);
    expect((await second as Table).toArray()).toEqual([{ a: 1 }]);
    expect(await Promise.race([first, Promise.resolve('pending')])).toBe('pending');
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
