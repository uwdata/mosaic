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

export interface Connector {
  /** Issue a query and return the result. */
  query(query: ArrowQueryRequest): Promise<ArrayBuffer | Uint8Array | Uint8Array[]>;
  query(query: ExecQueryRequest): Promise<void>;
}