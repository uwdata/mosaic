import { Table, tableFromArrays, tableToIPC } from '@uwdata/flechette';
import { Query, count, sum } from '@uwdata/mosaic-sql';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Coordinator } from '../src/Coordinator.js';
import { QueryManager } from '../src/QueryManager.js';
import { QueryState } from '../src/util/query-result.js';
import type { Connector, ConnectorQueryOptions, ConnectorQueryRequest } from '../src/connectors/Connector.js';
import type { Cache, QueryRequest } from '../src/types.js';

interface Call {
  request: ConnectorQueryRequest;
  signal?: AbortSignal;
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
}

/** A connector that holds each query until a test settles it. */
function heldConnector({ honorAbort = false } = {}) {
  const calls: Call[] = [];
  const connector = {
    query(request: ConnectorQueryRequest, options?: ConnectorQueryOptions) {
      return new Promise((resolve, reject) => {
        const signal = options?.signal;
        if (honorAbort) signal?.addEventListener('abort', () => reject(signal.reason));
        calls.push({ request, signal, resolve, reject });
      });
    }
  } as unknown as Connector;
  return { calls, connector };
}

function setup({ maxConcurrentRequests = 32, honorAbort = false } = {}) {
  const { calls, connector } = heldConnector({ honorAbort });
  const store = new Map<string, unknown>();
  const writes: string[] = [];
  const cache: Cache = {
    get: key => store.get(key),
    set: (key, value) => (store.set(key, value), writes.push(key), value),
    clear: () => store.clear(),
    bytes: () => 0
  };
  const manager = new QueryManager(maxConcurrentRequests);
  manager.connector(connector);
  manager.cache(cache);
  return { calls, store, writes, manager };
}

const bytes = tableToIPC(tableFromArrays({ a: [1] }), {})!;
const consolidatable = [count(), sum('v')].map(c => Query.from('t').select({ c }));
const consolidated = tableToIPC(tableFromArrays({ col0: [1], col1: [2] }), {})!;
const read = (sql = 'SELECT 1', cache = true): QueryRequest => ({ type: 'arrow', query: sql, cache });
const exec = (sql = 'CREATE TABLE t (x INT)'): QueryRequest => ({ type: 'exec', query: sql });
const flush = () => new Promise(resolve => setImmediate(resolve));

describe('QueryManager abort', () => {
  it('passes an abort signal to the connector', () => {
    const { calls, manager } = setup();
    manager.request(read());

    expect(calls).toHaveLength(1);
    expect(calls[0].request).toEqual({ type: 'arrow', sql: 'SELECT 1' });
    expect(calls[0].signal).toBeInstanceOf(AbortSignal);
    expect(calls[0].signal!.aborted).toBe(false);
  });

  it('aborts in-flight reads when cleared', async () => {
    const { calls, manager } = setup();
    const cleared = Promise.all([
      expect(manager.request(read('SELECT 1'))).rejects.toBe('Cleared'),
      expect(manager.request(read('SELECT 2', false))).rejects.toBe('Cleared')
    ]);

    manager.clear();
    await cleared;

    expect(calls.map(call => call.signal!.aborted)).toEqual([true, true]);
  });

  it('lets in-flight exec queries finish when cleared', async () => {
    const { calls, manager } = setup();
    const rejected = expect(manager.request(exec())).rejects.toBe('Cleared');

    manager.clear();
    await rejected;
    expect(calls[0].signal!.aborted).toBe(false);

    manager.request(read());
    expect(calls).toHaveLength(1);

    calls[0].resolve(undefined);
    await flush();
    expect(calls).toHaveLength(2);
  });

  it('drops requests awaiting consolidation when cleared', async () => {
    const { calls, manager } = setup();
    manager.consolidate(true);
    const rejected = expect(manager.request(read())).rejects.toBe('Cleared');

    manager.clear();
    await rejected;
    await flush();
    await flush();

    expect(calls).toHaveLength(0);
  });

  it('drops requests left in a disabled consolidator when cleared', async () => {
    const { calls, manager } = setup();
    manager.consolidate(true);
    const buffered = expect(manager.request(read('SELECT 1'))).rejects.toBe('Cleared');

    manager.consolidate(false);
    const direct = expect(manager.request(read('SELECT 2'))).rejects.toBe('Cleared');
    expect(calls).toHaveLength(1);

    manager.clear();
    await Promise.all([buffered, direct]);
    await flush();
    await flush();

    expect(calls).toHaveLength(1);
    expect(calls[0].signal!.aborted).toBe(true);
  });

  it('rejects consolidated requests awaiting delivery after consolidation is disabled', async () => {
    // the clear has to land between the combined result settling and
    // delivery, a few microtasks after the response, so try every offset
    for (let ticks = 0; ticks <= 30; ++ticks) {
      const { calls, manager } = setup();
      manager.consolidate(true);
      const results = consolidatable.map(query => manager.request({ type: 'arrow', query }));
      const outcomes = results.map(result => result.then(() => 'delivered', err => err));
      await flush();
      expect(calls).toHaveLength(1);

      manager.consolidate(false);
      calls[0].resolve(consolidated);
      for (let i = 0; i < ticks; ++i) await Promise.resolve();
      const pending = results.map(result => result.state === QueryState.pending);
      manager.clear();

      expect(await Promise.all(outcomes)).toEqual(pending.map(p => p ? 'Cleared' : 'delivered'));
    }
  });

  it('consolidates with the current cache after re-enabling', async () => {
    const { calls, store, manager } = setup();
    const replacement = new Map<string, unknown>();
    manager.consolidate(true);
    manager.consolidate(false);
    manager.cache({
      get: key => replacement.get(key),
      set: (key, value) => (replacement.set(key, value), value),
      clear: () => replacement.clear(),
      bytes: () => 0
    });
    manager.consolidate(true);
    const request = () => Promise.all(consolidatable.map(query => manager.request({ type: 'arrow', query, cache: true })));

    const first = request();
    await flush();
    calls[0].resolve(consolidated);
    await first;
    expect(store.size).toBe(0);
    expect(replacement.size).toBe(2);

    const second = request();
    await flush();
    expect(calls).toHaveLength(1);
    await second;
  });

  it('rejects canceled queries without aborting them', async () => {
    const { calls, manager } = setup();
    const result = manager.request(read());
    const rejected = expect(result).rejects.toBe('Canceled');

    manager.cancel([result]);
    await rejected;

    expect(calls[0].signal!.aborted).toBe(false);
  });

  it('sends a fresh request for a query cleared in flight', async () => {
    const { calls, manager } = setup();
    const rejected = expect(manager.request(read())).rejects.toBe('Cleared');

    manager.clear();
    const second = manager.request(read());
    expect(calls).toHaveLength(2);

    await rejected;
    await flush();
    const third = manager.request(read());
    expect(calls).toHaveLength(2);

    calls[1].resolve(bytes);
    const [a, b] = await Promise.all([second, third]) as Table[];
    expect(a.numRows).toBe(1);
    expect(b).toBe(a);
  });

  it('ignores a late failure of a cleared query', async () => {
    const { calls, manager } = setup();
    const rejected = expect(manager.request(read())).rejects.toBe('Cleared');

    manager.clear();
    await rejected;
    calls[0].reject(new Error('late'));
    await flush();
  });

  it('does not cache a response that settles around a clear', async () => {
    // the race spans a few microtasks after the response arrives, so sweep them
    for (let ticks = 0; ticks <= 8; ++ticks) {
      const { calls, writes, manager } = setup();
      const result = manager.request(read()).catch(() => {});

      calls[0].resolve(bytes);
      for (let i = 0; i < ticks; ++i) await Promise.resolve();
      const before = writes.length;
      manager.clear();
      await result;
      await flush();

      expect(writes).toHaveLength(before);
    }
  });
});

describe('QueryManager timeout', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('treats missing and invalid timeouts as disabled', () => {
    const manager = new QueryManager();
    expect(manager.timeout()).toBe(0);
    for (const value of [0, -1, NaN, Infinity, 2 ** 31]) {
      manager.timeout(100);
      expect(manager.timeout(value)).toBe(0);
    }
    expect(manager.timeout(2 ** 31 - 1)).toBe(2 ** 31 - 1);
  });

  it('rejects and aborts a query that exceeds the timeout', async () => {
    const { calls, manager } = setup();
    manager.timeout(100);
    const result = manager.request(read());
    const settled = vi.fn();
    const error = result.then(settled, err => (settled(), err));

    await vi.advanceTimersByTimeAsync(99);
    expect(settled).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    expect(await error).toMatchObject({
      name: 'TimeoutError',
      message: 'Query timed out after 100 ms'
    });
    expect(calls[0].signal!.reason).toBe(await error);
  });

  it('starts the clock when the query is sent', async () => {
    const { calls, manager } = setup({ maxConcurrentRequests: 0 });
    manager.timeout(100);
    const first = manager.request(read('SELECT 1'));
    const second = manager.request(read('SELECT 2'));
    const settled = vi.fn();
    const error = second.then(settled, err => (settled(), err));

    await vi.advanceTimersByTimeAsync(50);
    calls[0].resolve(bytes);
    await first;
    expect(calls).toHaveLength(2);

    await vi.advanceTimersByTimeAsync(99);
    expect(settled).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    expect(await error).toMatchObject({ name: 'TimeoutError' });
  });

  it('holds later queries until a timed-out exec finishes', async () => {
    const { calls, manager } = setup();
    manager.timeout(100);
    const error = manager.request(exec()).catch(err => err);
    manager.request(read());

    await vi.advanceTimersByTimeAsync(100);
    expect(await error).toMatchObject({ name: 'TimeoutError' });
    expect(calls[0].signal!.aborted).toBe(true);
    expect(calls).toHaveLength(1);

    calls[0].resolve(undefined);
    await flush();
    expect(calls).toHaveLength(2);
  });

  it('releases the queue once the connector stops a timed-out exec', async () => {
    const { calls, manager } = setup({ honorAbort: true });
    manager.timeout(100);
    const error = manager.request(exec()).catch(err => err);
    manager.request(read());

    await vi.advanceTimersByTimeAsync(100);

    expect(await error).toMatchObject({ name: 'TimeoutError' });
    expect(calls).toHaveLength(2);
  });

  it('does not cache a query that timed out', async () => {
    const { calls, store, manager } = setup();
    manager.timeout(100);
    const error = manager.request(read()).catch(err => err);

    await vi.advanceTimersByTimeAsync(100);
    await error;
    calls[0].resolve(bytes);
    await flush();

    expect(store.size).toBe(0);
    manager.request(read());
    expect(calls).toHaveLength(2);
  });

  it('reads the timeout from the coordinator options', async () => {
    const { calls, connector } = heldConnector();
    const coordinator = new Coordinator(connector, {
      timeout: 100,
      logger: null,
      consolidate: false
    });
    expect(coordinator.manager.timeout()).toBe(100);

    const error = coordinator.query('SELECT 1').catch(err => err);
    await vi.advanceTimersByTimeAsync(100);

    expect(await error).toMatchObject({ name: 'TimeoutError' });
    expect(calls[0].signal!.aborted).toBe(true);
  });
});
