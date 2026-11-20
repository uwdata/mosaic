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

export interface ConnectorQueryOptions {
  /** A signal that aborts when the result is no longer needed. */
  signal?: AbortSignal;
}

export interface Connector {
  /** Issue a query and return the result. */
  query(query: ArrowQueryRequest, options?: ConnectorQueryOptions): Promise<ArrowIPCBytes>;
  query(query: ExecQueryRequest, options?: ConnectorQueryOptions): Promise<void>;
}