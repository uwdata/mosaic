import { afterEach, describe, expect, it, vi } from 'vitest';
import { TableRefNode } from '@uwdata/mosaic-sql';
import { type PreAggregateLimits, PreAggregateRegistry } from '../src/preagg/PreAggregateRegistry.js';
import { ConnectorError } from '../src/connectors/errors.js';
import { QueryManager } from '../src/QueryManager.js';
import { flush, MockPreaggConnector } from './util/preagg-connector.js';

const SQL_A = 'SELECT a, count(*) AS n FROM t GROUP BY a';
const SQL_B = 'SELECT b, count(*) AS n FROM t GROUP BY b';
const SQL_C = 'SELECT c, count(*) AS n FROM t GROUP BY c';

function setup(limits: Partial<PreAggregateLimits> = {}, connector = new MockPreaggConnector()) {
  const manager = new QueryManager();
  manager.connector(connector);
  const invalidate = vi.spyOn(manager, 'invalidate');
  const registry = new PreAggregateRegistry(manager);
  registry.limits = { ...registry.limits, ...limits };
  return { registry, connector, invalidate };
}

describe('PreAggregateRegistry', () => {
  afterEach(() => vi.useRealTimers());

  it('requires a connector that transports preagg', async () => {
    const legacy = new MockPreaggConnector({ supportsPreagg: false });
    await expect(setup({}, legacy).registry.request(SQL_A)).rejects.toMatchObject({ code: 'unsupported_command' });
  });

  it('coalesces identical SQL and reuses a bounded cache of references', async () => {
    const { registry, connector } = setup({ maxCachedTables: 1 });
    const [p1, p2, p3] = [registry.request(SQL_A), registry.request(SQL_A), registry.request(SQL_B)];
    expect(connector.preaggRequests).toEqual([
      { type: 'preagg', sql: SQL_A },
      { type: 'preagg', sql: SQL_B }
    ]);
    expect(registry.pending).toBe(2);

    const response = connector.complete();
    connector.complete();
    const [t1, t2, t3] = await Promise.all([p1, p2, p3]);
    expect(t1).toBe(t2);
    expect(t1.table).toEqual([response.catalog, response.schema, response.table]);
    expect(t3).not.toBe(t1);
    expect(registry.pending).toBe(0);

    // completing B evicted A (LRU of one); A rebuilds, B is reused
    expect(registry.lookup(SQL_A)).toBeNull();
    expect(registry.lookup(SQL_B)).toBe(t3);
    expect(await registry.request(SQL_B)).toBe(t3);

    registry.request(SQL_A);
    registry.request(SQL_C);
    expect(registry.pending).toBe(2);
    expect(registry.lookup(SQL_B)).toBe(t3);
    connector.complete();
    connector.complete();
    await flush();
    expect(registry.lookup(SQL_A)).toBeNull();
    expect(registry.lookup(SQL_B)).toBeNull();
    expect(registry.lookup(SQL_C)).toBeInstanceOf(TableRefNode);
  });

  it('invalidates query results on every completed materialization', async () => {
    const { registry, connector, invalidate } = setup({ maxCachedTables: 0 });
    const a = registry.request(SQL_A);
    connector.complete();
    await a;
    expect(invalidate).toHaveBeenCalledTimes(1);
    expect(registry.lookup(SQL_A)).toBeNull();

    const again = registry.request(SQL_A);
    connector.complete();
    await again;
    expect(invalidate).toHaveBeenCalledTimes(2);

    const failed = registry.request(SQL_B);
    connector.fail(new Error('nope'));
    await expect(failed).rejects.toBeInstanceOf(ConnectorError);
    expect(invalidate).toHaveBeenCalledTimes(2);
  });

  const good = { catalog: 'memory', schema: 's', table: 't', createdAt: '2026-09-08T20:00:00Z' };

  it.each([
    ['empty object', {}],
    ['null', null],
    ['undefined', undefined],
    ['empty catalog', { ...good, catalog: '' }],
    ['non-string table', { ...good, table: 7 }],
    ['invalid createdAt', { ...good, createdAt: 'yesterday' }],
    ['missing createdAt', { catalog: 'memory', schema: 's', table: 't' }]
  ])('rejects a malformed success response without registering a table: %s', async (_, value) => {
    const { registry, connector } = setup();
    const promise = registry.request(SQL_A);
    connector.open[0].resolve(value);
    await expect(promise).rejects.toMatchObject({ code: 'malformed_response' });
    expect(registry.lookup(SQL_A)).toBeNull();
    await expect(registry.request(SQL_A)).rejects.toMatchObject({ code: 'suppressed' });
  });

  it('accepts a well-formed response and ignores unknown fields', async () => {
    const { registry, connector } = setup();
    const promise = registry.request(SQL_A);
    connector.open[0].resolve({ ...good, extra: 1 });
    expect((await promise).table).toEqual(['memory', 's', 't']);
  });

  it('refuses new builds at the pending limit without a cooldown', async () => {
    const { registry, connector } = setup({ maxPendingBuilds: 1 });
    const a = registry.request(SQL_A);
    await expect(registry.request(SQL_B)).rejects.toMatchObject({ code: 'lane_busy' });
    expect(registry.request(SQL_A)).toBe(a);
    expect(registry.pending).toBe(1);
    expect(registry.lookup(SQL_B)).toBeNull();

    connector.complete();
    await a;
    const b = registry.request(SQL_B);
    connector.complete();
    expect(await b).toBeInstanceOf(TableRefNode);
  });

  it.each([
    ['forbidden', new ConnectorError('denied', { code: 'forbidden', status: 403 }), 'forbidden'],
    ['deadline_exceeded', new ConnectorError('slow', { code: 'deadline_exceeded', status: 504 }), 'deadline_exceeded'],
    ['transport', new Error('socket hung up'), undefined]
  ])('applies one cooldown to a %s failure', async (_, failure, code) => {
    vi.useFakeTimers();
    const { registry, connector } = setup();
    const first = registry.request(SQL_A);
    connector.fail(failure);
    const err = await first.catch(e => e) as ConnectorError;
    expect(err).toBeInstanceOf(ConnectorError);
    expect(err.code).toBe(code);

    const suppressed = await registry.request(SQL_A).catch(e => e);
    expect(suppressed).toBeInstanceOf(ConnectorError);
    expect(suppressed).toMatchObject({ code: 'suppressed', cause: err });
    expect(connector.preaggRequests).toHaveLength(1);

    await vi.advanceTimersByTimeAsync(60_000);
    const retry = registry.request(SQL_A);
    expect(connector.preaggRequests).toHaveLength(2);
    connector.complete();
    expect(await retry).toBeInstanceOf(TableRefNode);
    expect(await registry.request(SQL_A)).toBe(await retry);
  });

  it('settles every waiter at the shared deadline and ignores a late response', async () => {
    vi.useFakeTimers();
    const { registry, connector } = setup({ timeoutMs: 1000, maxPendingBuilds: 1 });
    const a = registry.request(SQL_A);
    await vi.advanceTimersByTimeAsync(600);
    const joined = registry.request(SQL_A);
    await vi.advanceTimersByTimeAsync(400);

    for (const p of [a, joined]) {
      await expect(p).rejects.toMatchObject({ code: 'deadline_exceeded' });
    }
    expect(registry.pending).toBe(0);
    await expect(registry.request(SQL_A)).rejects.toMatchObject({ code: 'suppressed' });
    expect(registry.request(SQL_B)).toBeInstanceOf(Promise);

    connector.open[0].resolve({ catalog: 'x', schema: 'y', table: 'z', createdAt: '2026-01-01T00:00:00Z' });
    await vi.advanceTimersByTimeAsync(0);
    expect(registry.lookup(SQL_A)).toBeNull();
  });

  it('reset retires entries, clears cooldowns, and fences late responses', async () => {
    const { registry, connector, invalidate } = setup();
    const ready = registry.request(SQL_A);
    connector.complete();
    await ready;
    const failed = registry.request(SQL_C);
    connector.fail(new Error('nope'));
    await expect(failed).rejects.toBeInstanceOf(ConnectorError);
    const pending = registry.request(SQL_B);
    const request = connector.open[0];

    registry.reset();
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    expect(registry.pending).toBe(0);
    expect(registry.lookup(SQL_B)).toBeNull();
    expect(invalidate).toHaveBeenCalledTimes(2);
    expect(registry.request(SQL_C)).toBeInstanceOf(Promise);

    request.resolve({ catalog: 'x', schema: 'y', table: 'z', createdAt: '2026-01-01T00:00:00Z' });
    await flush();
    expect(registry.lookup(SQL_B)).toBeNull();
  });
});
