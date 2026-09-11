import type { Table } from '@uwdata/flechette';
import { TableRefNode } from '@uwdata/mosaic-sql';
import { fnv_hash } from '../util/hash.js';

export interface ConnectorQueryRequest {
  /** The query type. */
  type?: string;
  /** A SQL query string. */
  sql: string;
}

export interface ArrowQueryRequest extends ConnectorQueryRequest {
  /** The query type. */
  type?: 'arrow';
}

export interface ExecQueryRequest extends ConnectorQueryRequest {
  /** The query type. */
  type: 'exec';
}

export interface PreaggRequest extends ConnectorQueryRequest {
  type: 'preagg';
  sql: string;
}

export interface PreaggResponse {
  catalog: string;
  schema: string;
  table: string;
  /** RFC 3339 timestamp of the build's completion. */
  createdAt: string;
}

export type ConnectorRequest =
  | ArrowQueryRequest
  | ExecQueryRequest
  | PreaggRequest;

export interface Connector {
  /** Issue a query and return the result. */
  query(query: ArrowQueryRequest): Promise<Table>;
  query(query: ExecQueryRequest): Promise<void>;
  query(query: PreaggRequest): Promise<PreaggResponse>;
}

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
