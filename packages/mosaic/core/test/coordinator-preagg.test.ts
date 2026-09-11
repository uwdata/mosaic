import { describe, expect, it, vi } from 'vitest';
import { count, Query, TableRefNode } from '@uwdata/mosaic-sql';
import { clausePoint, Coordinator, PreAggregateModeError } from '../src/index.js';
import { PreAggregateInfo } from '../src/preagg/PreAggregator.js';
import { aggregateClient, flush, MockPreaggConnector, preaggCoordinator } from './util/preagg-connector.js';

describe('PreAggregator preagg mode', () => {
  it('only constructs the registry in preagg mode and keeps exec behavior', async () => {
    const connector = new MockPreaggConnector();
    const mc = new Coordinator(connector, { logger: null, preagg: { schema: 'custom' } });
    expect(mc.preaggregator.mode).toBe('exec');
    expect(mc.preaggregator.registry).toBeNull();
    mc.preaggregator.schema = 'changed';
    expect(mc.preaggregator.schema).toBe('changed');
    await mc.preaggregator.dropSchema();
    expect(connector.sql('exec')).toEqual(['DROP SCHEMA IF EXISTS "changed" CASCADE']);
    mc.preaggregator.reset();
    expect(connector.requests).toHaveLength(1);
  });

  it('treats schema assignment as a no-op and rejects dropSchema in preagg mode', async () => {
    const warn = vi.fn();
    const mc = new Coordinator(new MockPreaggConnector(), {
      logger: { ...console, warn },
      preagg: { mode: 'preagg', schema: 'initial' }
    });
    expect(mc.preaggregator.registry).toBeTruthy();
    mc.preaggregator.schema = 'other';
    expect(mc.preaggregator.schema).toBe('initial');
    expect(warn).toHaveBeenCalledTimes(1);
    await expect(mc.preaggregator.dropSchema()).rejects.toBeInstanceOf(PreAggregateModeError);
  });

  it('waits for the server reference, then falls back if a later build fails', async () => {
    const connector = new MockPreaggConnector();
    const mc = preaggCoordinator(connector, { maxCachedTables: 0 });
    const { client, sel, results } = await aggregateClient(mc);

    const source = {};
    sel.update(clausePoint('dim', 'b', { source }));
    await flush();
    const info = mc.preaggregator.entries.get(client) as PreAggregateInfo;
    expect(info).toBeInstanceOf(PreAggregateInfo);
    expect(info.table).toBeNull();
    expect(connector.preaggRequests[0].sql).toMatch(/^SELECT .* FROM "testData" GROUP BY/);
    expect(connector.sql()).toHaveLength(1);
    expect(mc.manager.pendingResults).toHaveLength(0);

    const response = connector.complete();
    await sel.pending('value');
    expect(info.table!.table).toEqual([response.catalog, response.schema, response.table]);
    expect(connector.sql()[1]).toContain(`FROM "memory"."mosaic_scope_test"."${response.table}" WHERE ("active0" IN ('b'))`);
    expect(results).toHaveLength(2);

    // maxCachedTables: 0 evicted the reference, so the next selection re-acquires
    sel.update(clausePoint('dim', 'a', { source }));
    await flush();
    expect(connector.preaggRequests).toHaveLength(2);
    connector.fail(new Error('denied'));
    await sel.pending('value');
    expect(info.result).toBeNull();
    expect(connector.sql().at(-1)).toBe(`SELECT count(*) AS "measure" FROM "testData" WHERE ("dim" IN ('a'))`);
  });

  it('rebinds when an evicted table is rebuilt under a different reference', async () => {
    const connector = new MockPreaggConnector();
    const mc = preaggCoordinator(connector, { maxCachedTables: 0 });
    const { client, sel } = await aggregateClient(mc);

    const source = {};
    sel.update(clausePoint('dim', 'a', { source }));
    await flush();
    const info = mc.preaggregator.entries.get(client) as PreAggregateInfo;
    const first = connector.complete();
    await sel.pending('value');
    expect(info.table!.table[2]).toBe(first.table);

    sel.update(clausePoint('dim', 'b', { source }));
    await flush();
    const second = connector.complete('_v2');
    await sel.pending('value');
    expect(mc.preaggregator.entries.get(client)).toBe(info);
    expect(info.table!.table[2]).toBe(second.table);
    expect(connector.sql().at(-1)).toContain(`."${second.table}" WHERE ("active0" IN ('b'))`);
  });

  it('shares one build across clients and keeps it alive across clear()', async () => {
    const connector = new MockPreaggConnector();
    const mc = preaggCoordinator(connector);
    const { sel } = await aggregateClient(mc);
    await aggregateClient(mc, sel);

    sel.update(clausePoint('dim', 'b', { source: {} }));
    await flush();
    expect(connector.preaggRequests).toHaveLength(1);

    mc.preaggregator.clear();
    expect(connector.open).toHaveLength(1);
    connector.complete();
    await flush();
    expect(mc.preaggregator.registry!.lookup(connector.preaggRequests[0].sql)).toBeInstanceOf(TableRefNode);
  });

  it('delivers a committed value when another source activates during a build', async () => {
    const connector = new MockPreaggConnector();
    const mc = preaggCoordinator(connector);
    const { sel, results } = await aggregateClient(mc);

    sel.update(clausePoint('dim', 'a', { source: {} }));
    await flush();
    sel.activate(clausePoint('dim', 'x', { source: {} }));
    await flush();
    while (connector.open.length) connector.complete();
    await sel.pending('value');
    expect(results).toHaveLength(2);
    expect(connector.sql().at(-1)).toContain(`WHERE ("active0" IN ('a'))`);
  });

  it('drops a suspended update superseded by requestQuery during the wait', async () => {
    const connector = new MockPreaggConnector();
    const mc = preaggCoordinator(connector);
    const { client, sel } = await aggregateClient(mc);

    sel.update(clausePoint('dim', 'b', { source: {} }));
    await flush();
    await mc.requestQuery(client, Query.from('other').select({ measure: count() }));
    expect(connector.sql().at(-1)).toBe('SELECT count(*) AS "measure" FROM "other"');
    const before = connector.requests.length;

    connector.complete();
    await sel.pending('value');
    await flush();
    expect(connector.requests).toHaveLength(before);
  });

  it('drops a suspended update when a full clear disconnects the client', async () => {
    const connector = new MockPreaggConnector();
    const mc = preaggCoordinator(connector);
    const { sel, results } = await aggregateClient(mc);
    sel.update(clausePoint('dim', 'a', { source: {} }));
    await flush();
    expect(connector.open).toHaveLength(1);
    const issued = connector.requests.length;
    mc.clear();
    await sel.pending('value');
    expect(results).toHaveLength(1);
    expect(connector.requests).toHaveLength(issued);
  });

  it.each(['connector', 'reset'])('falls back after %s replacement invalidates a bound table', async action => {
    const connector = new MockPreaggConnector();
    const mc = preaggCoordinator(connector);
    const { sel, results } = await aggregateClient(mc);
    const source = {};
    sel.update(clausePoint('dim', 'a', { source }));
    await flush();
    connector.complete();
    await sel.pending('value');
    expect(connector.sql().at(-1)).toContain('FROM "memory"');

    sel.update(clausePoint('dim', 'b', { source }));
    sel.activate(clausePoint('dim', 'x', { source: {} }));
    if (action === 'connector') mc.databaseConnector(new MockPreaggConnector());
    else mc.preaggregator.reset();
    await sel.pending('value');
    const current = mc.databaseConnector() as MockPreaggConnector;
    expect(results).toHaveLength(3);
    expect(current.sql().at(-1)).toBe(`SELECT count(*) AS "measure" FROM "testData" WHERE ("dim" IN ('b'))`);
  });

  it('retries an automatic entry refused while the lane was busy', async () => {
    const connector = new MockPreaggConnector();
    const mc = preaggCoordinator(connector, { maxPendingBuilds: 1 });
    const { client, sel } = await aggregateClient(mc);
    const other = await aggregateClient(mc);

    other.sel.update(clausePoint('cat', 'c', { source: {} }));
    await flush();
    expect(connector.open).toHaveLength(1);

    const source = {};
    sel.update(clausePoint('dim', 'a', { source }));
    await sel.pending('value');
    expect((mc.preaggregator.entries.get(client) as PreAggregateInfo).result).toBeNull();
    expect(connector.preaggRequests).toHaveLength(1);
    expect(connector.sql().at(-1)).toContain(`FROM "testData" WHERE ("dim" IN ('a'))`);

    connector.complete();
    await other.sel.pending('value');
    sel.update(clausePoint('dim', 'b', { source }));
    await flush();
    expect(connector.preaggRequests).toHaveLength(2);
    connector.complete();
    await sel.pending('value');
    expect(connector.sql().at(-1)).toContain(`WHERE ("active0" IN ('b'))`);
  });

  it('falls back and cools down when the connector cannot transport preagg', async () => {
    const connector = new MockPreaggConnector({ supportsPreagg: false });
    const mc = preaggCoordinator(connector);
    const { sel } = await aggregateClient(mc);

    const source = {};
    sel.update(clausePoint('dim', 'a', { source }));
    await sel.pending('value');
    expect(connector.preaggRequests).toHaveLength(1);
    expect(connector.sql().at(-1)).toContain(`FROM "testData" WHERE ("dim" IN ('a'))`);

    sel.update(clausePoint('dim', 'b', { source }));
    await sel.pending('value');
    expect(connector.preaggRequests).toHaveLength(1);
    expect(connector.sql().at(-1)).toContain(`FROM "testData" WHERE ("dim" IN ('b'))`);
  });

  describe.each(['exec', 'preagg'] as const)('%s mode lifecycle', mode => {
    it.each(['reset', 'clear', 'connector'])('preserves bindings until %s', async action => {
      const connector = new MockPreaggConnector();
      const mc = mode === 'preagg'
        ? preaggCoordinator(connector)
        : new Coordinator(connector, { logger: null, cache: false, consolidate: false });
      const { client, sel } = await aggregateClient(mc);
      const { registry } = mc.preaggregator;

      sel.update(clausePoint('dim', 'a', { source: {} }));
      await flush();
      if (mode === 'preagg') connector.complete();
      await sel.pending('value');
      const info = mc.preaggregator.entries.get(client) as PreAggregateInfo;
      expect(info).toBeInstanceOf(PreAggregateInfo);
      expect(info.table).toBeInstanceOf(TableRefNode);
      const sql = info.create.toString();
      if (registry) expect(registry.lookup(sql)).toBe(info.table);

      mc.databaseConnector(connector);
      expect(mc.preaggregator.entries.get(client)).toBe(info);
      if (registry) expect(registry.lookup(sql)).toBe(info.table);
      for (const options of [{ clients: false }, { cache: false }]) {
        mc.clear(options);
        expect(mc.preaggregator.entries.get(client)).toBe(info);
        if (registry) expect(registry.lookup(sql)).toBe(info.table);
      }

      if (action === 'reset') mc.preaggregator.reset();
      else if (action === 'clear') mc.clear();
      else mc.databaseConnector(new MockPreaggConnector());
      expect(mc.preaggregator.entries.size).toBe(0);
      if (registry) expect(registry.lookup(sql)).toBeNull();
    });
  });

  it('disabling clears client state but leaves cached tables and builds', async () => {
    const connector = new MockPreaggConnector();
    const mc = preaggCoordinator(connector);
    const { sel } = await aggregateClient(mc);

    const source = {};
    sel.update(clausePoint('dim', 'a', { source }));
    await flush();
    mc.preaggregator.enabled = false;
    expect(mc.preaggregator.entries.size).toBe(0);
    expect(connector.open).toHaveLength(1);
    connector.complete();
    await sel.pending('value');
    expect(mc.preaggregator.registry!.lookup(connector.preaggRequests[0].sql)).toBeInstanceOf(TableRefNode);

    sel.update(clausePoint('dim', 'b', { source }));
    await sel.pending('value');
    expect(connector.sql().at(-1)).toBe(`SELECT count(*) AS "measure" FROM "testData" WHERE ("dim" IN ('b'))`);

    mc.preaggregator.enabled = true;
    sel.update(clausePoint('dim', 'a', { source }));
    await sel.pending('value');
    expect(connector.preaggRequests).toHaveLength(1);
    expect(connector.sql().at(-1)).toContain(`WHERE ("active0" IN ('a'))`);
  });

  it('serializes queued selection updates behind the pending build', async () => {
    const connector = new MockPreaggConnector();
    const mc = preaggCoordinator(connector);
    const { sel } = await aggregateClient(mc);

    const source = {};
    sel.update(clausePoint('dim', 'a', { source }));
    await flush();
    sel.update(clausePoint('dim', 'b', { source }));
    await flush();
    expect(connector.preaggRequests).toHaveLength(1);
    expect(connector.sql()).toHaveLength(1);

    connector.complete();
    await sel.pending('value');
    const queries = connector.sql().slice(1);
    expect(queries).toHaveLength(2);
    expect(queries[0]).toContain(`WHERE ("active0" IN ('a'))`);
    expect(queries[1]).toContain(`WHERE ("active0" IN ('b'))`);
  });
});
