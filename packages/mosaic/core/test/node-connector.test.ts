import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DuckDB } from '@uwdata/mosaic-duckdb';
import { TableRefNode } from '@uwdata/mosaic-sql';
import { NodeConnector } from '../src/connectors/NodeConnector.js';

let db: DuckDB;
let connector: NodeConnector;

beforeEach(async () => {
  db = new DuckDB();
  connector = await NodeConnector.make(db);
});

afterEach(() => db.close());

describe('NodeConnector', () => {
  it('materializes and shares one temporary table for concurrent requests', async () => {
    await connector.query({ type: 'exec', sql: 'CREATE TABLE source AS SELECT * FROM (VALUES (1), (2), (2)) t(x)' });
    const request = { type: 'preagg', sql: 'SELECT x, count(*) AS n FROM source GROUP BY x' } as const;
    const [first, second] = await Promise.all([connector.query(request), connector.query(request)]);
    expect(first).toEqual(second);
    expect(await connector.query(request)).toEqual(first);
    expect(Number.isNaN(Date.parse(first.createdAt))).toBe(false);
    const table = new TableRefNode([first.catalog, first.schema, first.table]);
    const result = await connector.query({ sql: `SELECT * FROM ${table} ORDER BY x` });
    expect(result.toArray()).toEqual([{ x: 1, n: 1 }, { x: 2, n: 2 }]);
    expect(await db.query('SELECT count(*) AS n FROM duckdb_tables() WHERE temporary')).toEqual([{ n: '1' }]);
  });

  it.each([
    '',
    'SELECT 1; SELECT 2',
    'SELECT 1; CREATE TABLE injected AS SELECT 2',
    'CREATE TABLE injected AS SELECT 2',
    'DELETE FROM source'
  ])('rejects a non-SELECT command without executing it: %s', async sql => {
    await expect(connector.query({ type: 'preagg', sql })).rejects.toMatchObject({ code: 'bad_request' });
    expect(await db.query('SELECT table_name FROM duckdb_tables()')).toEqual([]);
  });

  it('retries a failed build once its source is available', async () => {
    const request = { type: 'preagg', sql: 'SELECT * FROM source' } as const;
    await expect(connector.query(request)).rejects.toThrow();
    await connector.query({ type: 'exec', sql: 'CREATE TABLE source AS SELECT 42 AS x' });
    const response = await connector.query(request);
    const table = new TableRefNode([response.catalog, response.schema, response.table]);
    expect((await connector.query({ sql: `SELECT * FROM ${table}` })).toArray()).toEqual([{ x: 42 }]);
  });

  it('classifies only missing tables owned by this connector', async () => {
    const response = await connector.query({ type: 'preagg', sql: 'SELECT 42 AS x' });
    const { catalog, schema, table: name } = response;
    const table = new TableRefNode([catalog, schema, name]);
    await connector.query({ type: 'exec', sql: `DROP TABLE ${table}` });
    await expect(connector.query({ sql: `WITH source AS (SELECT * FROM ${table}) SELECT * FROM source` }))
      .rejects.toMatchObject({ code: 'table_not_found', catalog, schema, table: name });
    await expect(connector.query({ sql: 'SELECT * FROM missing_source' }))
      .rejects.not.toHaveProperty('code');
    await expect(connector.query({ sql: `SELECT '${table}' AS name, unknown_column` }))
      .rejects.not.toHaveProperty('code');
    const replacement = await connector.query({ type: 'preagg', sql: 'SELECT 42 AS x' });
    expect(replacement.table).not.toBe(name);
  });
});
