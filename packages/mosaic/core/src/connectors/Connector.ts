import type { Table } from '@uwdata/flechette';

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

export interface JSONQueryRequest extends ConnectorQueryRequest {
  /** The query type. */
  type: 'json';
}

export interface Connector {
  /** Issue a query and return the result. */
  query(query: ArrowQueryRequest): Promise<Table>;
  query(query: ExecQueryRequest): Promise<void>;
  query(query: JSONQueryRequest): Promise<Record<string, unknown>[]>;
}