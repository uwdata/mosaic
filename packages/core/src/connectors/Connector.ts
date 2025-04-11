import type { Table } from '@uwdata/flechette';

export interface QueryRequest {
  /** The query type. */
  type?: string;
  /** A SQL query string. */
  sql: string;
}

export interface ArrowQueryRequest extends QueryRequest {
  /** The query type. */
  type?: 'arrow';
}

export interface ExecQueryRequest extends QueryRequest {
  /** The query type. */
  type: 'exec';
}

export interface JSONQueryRequest extends QueryRequest {
  /** The query type. */
  type: 'json';
}

export interface Connector {
  /** Issue a query and return the result. */
  query(query: ArrowQueryRequest): Promise<Table>;
  query(query: ExecQueryRequest): Promise<undefined>;
  query(query: JSONQueryRequest): Promise<Record<string, any>[]>;
}
