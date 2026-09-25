import { DuckDB } from '@uwdata/mosaic-duckdb';
import type {
  ArrowQueryRequest,
  Connector,
  ConnectorQueryRequest,
  ExecQueryRequest
} from './Connector.js';

/**
 * A Mosaic Connector backed by an in-process Node.js DuckDB instance.
 * Requires the optional peer dependency `@uwdata/mosaic-duckdb`.
 */
export class NodeConnector implements Connector {
  protected _db: DuckDB;

  static async make(db?: DuckDB) {
    const connector = new NodeConnector(db);
    // make sure initialization is complete
    await connector._db._init;
    return connector;
  }

  constructor(db: DuckDB = new DuckDB()) {
    this._db = db;
  }

  /**
   * Query an in-process DuckDB instance.
   * @param query Query object with type and SQL
   * @returns the query result
   */
  async query(query: ArrowQueryRequest): Promise<Uint8Array[]>;
  async query(query: ExecQueryRequest): Promise<void>;
  async query(query: ConnectorQueryRequest): Promise<unknown> {
    const { type, sql } = query;
    return type === 'exec' ? this._db.exec(sql) : this._db.arrowBuffer(sql);
  }
}
