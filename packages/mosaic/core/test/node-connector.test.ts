import { describe, expect, it } from 'vitest';
import type { Table } from '@uwdata/flechette';
import { loadObjects, TableRefNode } from '@uwdata/mosaic-sql';
import { clausePoint } from '../src/index.js';
import { NodeConnector } from '../src/connectors/NodeConnector.js';
import type { PreAggregateInfo } from '../src/preagg/PreAggregator.js';
import { aggregateClient, preaggCoordinator } from './util/preagg-connector.js';

describe('NodeConnector preagg', () => {
  it('materializes a temporary table and reuses it for identical SQL', async () => {
    const connector = await NodeConnector.make();
    await connector.query({ type: 'exec', sql: 'CREATE TABLE source AS SELECT * FROM (VALUES (1), (2), (2)) t(x)' });
    const request = { type: 'preagg', sql: 'SELECT x, count(*) AS n FROM source GROUP BY x' } as const;
    const [first, second] = await Promise.all([connector.query(request), connector.query(request)]);
    expect(second.table).toBe(first.table);
    const table = new TableRefNode([first.catalog, first.schema, first.table]);
    const result = await connector.query({ sql: `SELECT * FROM ${table} ORDER BY x` });
    expect(result.toArray()).toEqual([{ x: 1, n: 1 }, { x: 2, n: 2 }]);
    expect(await connector.query({ sql: 'SELECT count(*) AS n FROM duckdb_tables() WHERE temporary' }))
      .toMatchObject({ numRows: 1 });
  });

  it('serves a coordinator in preagg mode', async () => {
    const mc = preaggCoordinator(await NodeConnector.make());
    await mc.exec(loadObjects('testData', [{ dim: 'a' }, { dim: 'b' }, { dim: 'b' }]));
    const { client, sel, results } = await aggregateClient(mc);
    sel.update(clausePoint('dim', 'b', { source: {} }));
    await sel.pending('value');
    expect((results.at(-1) as Table).toArray()).toEqual([{ measure: 2 }]);
    const info = mc.preaggregator.entries.get(client) as PreAggregateInfo;
    expect(info.table!.table).toEqual(['temp', 'main', expect.stringMatching(/^preagg_[0-9a-f]+$/)]);
  });
});
