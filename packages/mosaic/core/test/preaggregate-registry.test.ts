import { afterEach, describe, expect, it, vi } from 'vitest';
import { TableRefNode } from '@uwdata/mosaic-sql';
import { type PreAggregateLimits, PreAggregateRegistry } from '../src/preagg/PreAggregateRegistry.js';
import { ConnectorError } from '../src/connectors/errors.js';
import { QueryManager } from '../src/QueryManager.js';
import { flush, MockPreaggConnector } from './util/preagg-connector.js';

const SQL_A = 'SELECT a, count(*) AS n FROM t GROUP BY a';
const SQL_B = 'SELECT b, count(*) AS n FROM t GROUP BY b';
const SQL_C = 'SELECT c, count(*) AS n FROM t GROUP BY c';

function setup(limits: Partial<PreAggregateLimits> = {}) {
  const connector = new MockPreaggConnector();
  const manager = new QueryManager();
  manager.connector(connector);
  const invalidate = vi.spyOn(manager, 'invalidate');
  const registry = new PreAggregateRegistry(manager);
  registry.limits = { ...registry.limits, ...limits };
  return { registry, connector, invalidate };
}

describe('PreAggregateRegistry', () => {
  afterEach(() => vi.useRealTimers());

  it('coalesces identical SQL and reuses completed references', async () => {
    const { registry, connector } = setup();
    const [p1, p2, p3] = [registry.request(SQL_A), registry.request(SQL_A), registry.request(SQL_B)];
    expect(connector.preaggRequests).toEqual([
      { type: 'preagg', sql: SQL_A },
      { type: 'preagg', sql: SQL_B }
    ]);

    const response = connector.complete();
    connector.complete();
    const [t1, t2, t3] = await Promise.all([p1, p2, p3]);
    expect(t1).toBe(t2);
    expect(t1.table).toEqual(['memory', 'mosaic_scope_test', response.reference.table]);
    expect(t3).not.toBe(t1);

    expect(registry.lookup(SQL_A)).toBe(t1);
    expect(registry.lookup(SQL_B)).toBe(t3);
    expect(await registry.request(SQL_A)).toBe(t1);
    expect(connector.preaggRequests).toHaveLength(2);
  });

  const good = { reference: { catalog: 'memory', schema: ['s'], table: 't' }, createdAt: '2026-09-08T20:00:00Z' };

  it.each([
    ['empty object', {}],
    ['null', null],
    ['empty catalog', { ...good, reference: { ...good.reference, catalog: '' } }],
    ['non-string table', { ...good, reference: { ...good.reference, table: 7 } }],
    ['string schema', { ...good, reference: { ...good.reference, schema: 's' } }],
    ['empty schema path', { ...good, reference: { ...good.reference, schema: [] } }],
    ['invalid createdAt', { ...good, createdAt: 'yesterday' }],
    ['missing createdAt', { reference: good.reference }]
  ])('rejects a malformed success response without registering a table: %s', async (_, value) => {
    const { registry, connector } = setup();
    const promise = registry.request(SQL_A);
    connector.open[0].resolve(value);
    const err = await promise.catch(e => e) as ConnectorError;
    expect(err).toBeInstanceOf(ConnectorError);
    expect(err.message).toBe('Malformed preagg response');
    expect(err.code).toBeUndefined();
    expect(registry.lookup(SQL_A)).toBeNull();
    await expect(registry.request(SQL_A)).rejects.toMatchObject({ cause: err });
  });

  it('accepts a well-formed response and ignores unknown fields', async () => {
    const { registry, connector } = setup();
    const promise = registry.request(SQL_A);
    connector.open[0].resolve({ ...good, extra: 1 });
    expect((await promise).table).toEqual(['memory', 's', 't']);
    const nested = registry.request(SQL_B);
    connector.open[0].resolve({ ...good, reference: { catalog: 'lake', schema: ['ns', 'sub'], table: 't' } });
    expect((await nested).table).toEqual(['lake', 'ns', 'sub', 't']);
  });

  it.each([
    ['unsupported_command', new ConnectorError('Unsupported command: preagg', { code: 'unsupported_command' }), 'unsupported_command'],
    ['transport', new Error('socket hung up'), undefined]
  ])('applies one cooldown to a %s failure', async (_, failure, code) => {
    vi.useFakeTimers();
    const { registry, connector } = setup();
    const first = registry.request(SQL_A);
    connector.fail(failure);
    const err = await first.catch(e => e) as ConnectorError;
    expect(err).toBeInstanceOf(ConnectorError);
    expect(err.code).toBe(code);

    const suppressed = await registry.request(SQL_A).catch(e => e) as ConnectorError;
    expect(suppressed).toBeInstanceOf(ConnectorError);
    expect(suppressed.message).toBe(`Preaggregation throttled after a recent failure: ${err.message}`);
    expect(suppressed.code).toBeUndefined();
    expect(suppressed.cause).toBe(err);
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
    const { registry, connector } = setup({ timeoutMs: 1000 });
    const a = registry.request(SQL_A);
    await vi.advanceTimersByTimeAsync(600);
    const joined = registry.request(SQL_A);
    await vi.advanceTimersByTimeAsync(400);

    for (const p of [a, joined]) {
      const err = await p.catch(e => e) as ConnectorError;
      expect(err).toBeInstanceOf(ConnectorError);
      expect(err.message).toBe('Preaggregation deadline exceeded');
      expect(err.code).toBeUndefined();
    }
    await expect(registry.request(SQL_A)).rejects
      .toThrow('Preaggregation throttled after a recent failure: Preaggregation deadline exceeded');

    connector.open[0].resolve({ reference: { catalog: 'x', schema: ['y'], table: 'z' }, createdAt: '2026-01-01T00:00:00Z' });
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
    expect(registry.lookup(SQL_B)).toBeNull();
    expect(invalidate).toHaveBeenCalledTimes(1);
    expect(registry.request(SQL_C)).toBeInstanceOf(Promise);

    request.resolve({ reference: { catalog: 'x', schema: ['y'], table: 'z' }, createdAt: '2026-01-01T00:00:00Z' });
    await flush();
    expect(registry.lookup(SQL_B)).toBeNull();
  });
});
