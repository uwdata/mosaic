import { TableRefNode } from '@uwdata/mosaic-sql';
import type { Connector, PreaggResponse } from './Connector.js';
import { fnv_hash } from '../util/hash.js';

/**
 * Serve a `preagg` request with the connector's own `exec`, for connectors
 * that run DuckDB in-process and have no server to delegate to. The table
 * is temporary and released when the connection closes.
 */
export async function materializeWithExec(connector: Connector, sql: string): Promise<PreaggResponse> {
  const table = `preagg_${fnv_hash(sql).toString(16)}`;
  const ref = new TableRefNode(['temp', 'main', table]);
  await connector.query({ type: 'exec', sql: `CREATE TEMP TABLE IF NOT EXISTS ${ref} AS ${sql}` });
  return { catalog: 'temp', schema: 'main', table, createdAt: new Date().toISOString() };
}
