import { describe, expect, it } from 'vitest';
import type { Table } from '@uwdata/flechette';
import { loadObjects } from '@uwdata/mosaic-sql';
import { clausePoint, decodeIPC } from '../src/index.js';
import { NodeConnector } from '../src/connectors/NodeConnector.js';
import type { PreAggregateInfo } from '../src/preagg/PreAggregator.js';
import { aggregateClient, preaggCoordinator } from './util/preagg-connector.js';

describe('NodeConnector preagg', () => {
  it('serves a coordinator from one temporary table per distinct SQL', async () => {
    const connector = await NodeConnector.make();
    const mc = preaggCoordinator(connector);
    await mc.exec(loadObjects('testData', [{ dim: 'a' }, { dim: 'b' }, { dim: 'b' }]));
    const { client, sel, results } = await aggregateClient(mc);
    sel.update(clausePoint('dim', 'b', { source: {} }));
    await sel.pending('value');
    expect((results.at(-1) as Table).toArray()).toEqual([{ measure: 2 }]);
    const { create, table } = mc.preaggregator.entries.get(client) as PreAggregateInfo;
    expect(table!.table).toEqual(['temp', 'main', expect.stringMatching(/^preagg_[0-9a-f]+$/)]);

    const { reference } = await connector.query({ type: 'preagg', sql: create.toString() });
    expect([reference.catalog, ...reference.schema, reference.table]).toEqual(table!.table);
    const temporary = decodeIPC(await connector.query({ type: 'arrow', sql: 'SELECT table_name FROM duckdb_tables() WHERE temporary' }));
    expect(temporary.toArray()).toEqual([{ table_name: table!.table.at(-1) }]);
  });
});
