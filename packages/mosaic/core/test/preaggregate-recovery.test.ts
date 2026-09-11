import { describe, expect, it } from 'vitest';
import type { Table } from '@uwdata/flechette';
import { loadObjects, Query, TableRefNode } from '@uwdata/mosaic-sql';
import { DuckDB } from '@uwdata/mosaic-duckdb';
import { clausePoint } from '../src/index.js';
import { NodeConnector } from '../src/connectors/NodeConnector.js';
import { ConnectorError } from '../src/connectors/errors.js';
import type { PreAggregateInfo } from '../src/preagg/PreAggregator.js';
import { aggregateClient, flush, MockPreaggConnector, preaggCoordinator } from './util/preagg-connector.js';

function missingTable(table: TableRefNode) {
  const [catalog, schema, name] = table.table;
  return new ConnectorError('Materialized table is unavailable', {
    code: 'table_not_found', catalog, schema, table: name
  });
}

async function setup(clientCount = 1) {
  const connector = new MockPreaggConnector();
  const mc = preaggCoordinator(connector);
  mc.manager.cache(true);
  const first = await aggregateClient(mc);
  const clients = [first];
  for (let i = 1; i < clientCount; ++i) clients.push(await aggregateClient(mc, first.sel));
  const source = {};
  first.sel.update(clausePoint('dim', 'a', { source }));
  await flush();
  connector.complete();
  await first.sel.pending('value');
  const info = mc.preaggregator.entries.get(first.client) as PreAggregateInfo;
  return { connector, mc, ...first, clients, source, info, table: info.table! };
}

describe('PreAggregator recovery', () => {
  it('rebuilds a dropped DuckDB table and reads its rows', async () => {
    const db = new DuckDB();
    try {
      const connector = await NodeConnector.make(db);
      const mc = preaggCoordinator(connector);
      mc.manager.cache(true);
      await mc.exec(loadObjects('testData', [{ dim: 'a' }, { dim: 'b' }, { dim: 'b' }]));
      const { client, sel, results } = await aggregateClient(mc);
      const source = {};

      sel.update(clausePoint('dim', 'a', { source }));
      await sel.pending('value');
      const info = mc.preaggregator.entries.get(client) as PreAggregateInfo;
      const table = info.table!;
      expect((results.at(-1) as Table).toArray()).toEqual([{ measure: 1 }]);

      await connector.query({ type: 'exec', sql: `DROP TABLE ${table}` });
      sel.update(clausePoint('dim', 'b', { source }));
      await sel.pending('value');

      expect(info.table!.table).not.toEqual(table.table);
      expect((results.at(-1) as Table).toArray()).toEqual([{ measure: 2 }]);
    } finally {
      db.close();
    }
  });

  it.each([false, true])('shares recovery across clients, including late failures (%s)', async late => {
    const { connector, mc, sel, clients, source, table } = await setup(2);
    mc.manager.cache(false);
    let misses = 0;
    let reject!: (error: Error) => void;
    connector.handler = request => {
      if (request.sql.includes(String(table)) && ++misses <= 2) {
        return late && misses === 2 ? new Promise((_, fail) => { reject = fail; })
          : Promise.reject(missingTable(table));
      }
      return [];
    };

    sel.update(clausePoint('dim', 'b', { source }));
    await flush();
    expect(connector.preaggRequests).toHaveLength(2);
    connector.complete();
    await flush();
    if (late) reject(missingTable(table));
    await sel.pending('value');
    expect(connector.preaggRequests).toHaveLength(2);
    for (const { results } of clients) expect(results).toHaveLength(3);
  });

  it.each(['build', 'query'])('falls back without another rebuild when the recovery %s fails', async failure => {
    const { connector, sel, source, table } = await setup();
    connector.handler = request => request.sql.includes(String(table))
      ? Promise.reject(missingTable(table)) : [];
    sel.update(clausePoint('dim', 'b', { source }));
    await flush();
    if (failure === 'build') connector.fail(new Error('build failed'));
    else connector.complete();
    await sel.pending('value');
    expect(connector.preaggRequests).toHaveLength(2);
    expect(connector.sql().at(-1)).toBe(`SELECT count(*) AS "measure" FROM "testData" WHERE ("dim" IN ('b'))`);
  });

  it.each([
    { code: 'forbidden' },
    { code: 'unauthenticated' },
    { catalog: 'other' },
    { schema: 'other' },
    { table: 'testData' },
    { table: undefined },
    { code: undefined }
  ])('does not recover an unrelated or unclassified error: %j', async fields => {
    const { connector, sel, source, table } = await setup();
    const error = Object.assign(missingTable(table), fields);
    connector.handler = request => request.sql.includes(String(table)) ? Promise.reject(error) : [];
    sel.update(clausePoint('dim', 'b', { source }));
    await sel.pending('value');
    expect(connector.preaggRequests).toHaveLength(1);
    expect(connector.sql().at(-1)).toContain('FROM "testData"');
  });

  it.each(['request', 'disconnect', 'reset', 'connector', 'activate'])('preserves client ownership when %s interrupts recovery', async action => {
    const { connector, mc, client, sel, source, table, results } = await setup();
    connector.handler = request => request.sql.includes(String(table)) ? Promise.reject(missingTable(table)) : [];
    sel.update(clausePoint('dim', 'b', { source }));
    await flush();
    expect(connector.preaggRequests).toHaveLength(2);

    if (action === 'request') await mc.requestQuery(client, Query.from('other').select('*'));
    else if (action === 'disconnect') mc.disconnect(client);
    else if (action === 'reset') mc.preaggregator.reset();
    else if (action === 'connector') mc.databaseConnector(new MockPreaggConnector());
    else sel.activate(clausePoint('dim', 'x', { source: {} }));
    const current = mc.databaseConnector() as MockPreaggConnector;
    while (connector.open.length) connector.complete();
    await sel.pending('value');
    if (action === 'request' || action === 'disconnect') {
      expect(results).toHaveLength(action === 'request' ? 3 : 2);
    } else {
      expect(results).toHaveLength(3);
      expect(current.sql().at(-1)).toBe(`SELECT count(*) AS "measure" FROM "testData" WHERE ("dim" IN ('b'))`);
    }
  });
});
