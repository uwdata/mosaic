import type { ArrowIPCBytes } from '../types.js';

export interface ConnectorQueryRequest {
  /** The query type. */
  type: string;
  /** A SQL query string. */
  sql: string;
}

export interface ArrowQueryRequest extends ConnectorQueryRequest {
  /** The query type. */
  type: 'arrow';
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
  query(query: ArrowQueryRequest): Promise<ArrowIPCBytes>;
  query(query: ExecQueryRequest): Promise<void>;
  query(query: PreaggRequest): Promise<PreaggResponse>;
}
