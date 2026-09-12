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

export interface Connector {
  /** Issue a query and return the result. */
  query(query: ArrowQueryRequest): Promise<ArrowIPCBytes>;
  query(query: ExecQueryRequest): Promise<void>;
}