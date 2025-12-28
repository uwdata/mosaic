import type { DescribeQuery, ExprNode, Query } from '@uwdata/mosaic-sql';
import type { QueryResult } from './util/query-result.js';

/** Type for a query request. */
export interface QueryRequest {
  type: 'exec' | 'json' | 'arrow';
  query: string | Query | DescribeQuery;
  cache?: boolean;
  options?: Record<string, unknown>;
  clientId?: string;
}

/** Type for an entry within a query manager. */
export interface QueryEntry {
  request: QueryRequest;
  result: QueryResult;
}

/** Query type accepted by a coordinator. */
export type QueryType =
  | string
  | Query
  | DescribeQuery;

/** String indicating a JavaScript data type. */
export type JSType =
  | 'number'
  | 'date'
  | 'boolean'
  | 'string'
  | 'array'
  | 'object';

/** String indicating a requested summary statistic. */
export type Stat =
  | 'count'
  | 'nulls'
  | 'max'
  | 'min'
  | 'distinct';

/** A reference to a database column or expression. */
export type FieldRef = string | ExprNode;

/**
 * A request for metadata information about a database column.
 */
export interface FieldInfoRequest {
  table: string;
  column: FieldRef;
  stats?: Stat[];
}

/**
 * A response with metadata information about a database column.
 */
export interface FieldInfo extends Partial<Record<Stat, number>> {
  table: string,
  column: string,
  sqlType: string,
  type: JSType,
  nullable: boolean
}

/** A result row from a DESCRIBE query. */
export interface ColumnDescription {
  column_name: string,
  column_type: string,
  null: 'YES' | 'NO'
}

/**
 * Interface for components that perform selection activation.
 */
export interface Activatable {
  /**
   * Activate the selection that this component publishes to.
   */
  activate(): void;
}

/**
 * Interface for cache implementations.
 */
export interface Cache {
  get(key: string): unknown;
  set(key: string, value: unknown): unknown;
  clear(): void;
}

/**
 * Interface for logger implementations
 */
export interface Logger {
  debug(...args: unknown[]): void;
  info(...args: unknown[]): void;
  log(...args: unknown[]): void;
  warn(...args: unknown[]): void;
  error(...args: unknown[]): void;
  group(label?: unknown): void;
  groupCollapsed(label?: unknown): void;
  groupEnd(): void;
}
