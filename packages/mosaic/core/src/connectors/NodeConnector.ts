import type { ExtractionOptions, Table } from '@uwdata/flechette';
import { DuckDB } from '@uwdata/mosaic-duckdb';
import { decodeIPC } from '../util/decode-ipc.js';
import type {
  ArrowQueryRequest,
  Connector,
  ConnectorQueryRequest,
  ExecQueryRequest,
  JSONQueryRequest
} from './Connector.js';

/**
 * A Mosaic Connector backed by an in-process Node.js DuckDB instance.
 * Requires the optional peer dependency `@uwdata/mosaic-duckdb`.
 */
export class NodeConnector implements Connector {
  protected _db: DuckDB;
  protected _ipc?: ExtractionOptions;

  static async make(db?: DuckDB, ipc?: ExtractionOptions) {
    const connector = new NodeConnector(db, ipc);
    // make sure initialization is complete
    await connector._db._init;
    return connector;
  }

  constructor(
    db: DuckDB = new DuckDB(),
    ipc?: ExtractionOptions
  ) {
    this._db = db;
    this._ipc = ipc;
  }

  /**
   * Query an in-process DuckDB instance.
   * @param query Query object with type and SQL
   * @returns the query result
   */
  async query(query: ArrowQueryRequest): Promise<Table>;
  async query(query: ExecQueryRequest): Promise<void>;
  async query(query: JSONQueryRequest): Promise<Record<string, unknown>[]>;
  async query(query: ConnectorQueryRequest): Promise<unknown> {
    const { type, sql } = query;
    switch (type) {
      case 'exec':
        return this._db.exec(sql);
      case 'arrow':
        return decodeIPC(await this._db.arrowBuffer(sql), this._ipc);
      default:
        return this._db.query(sql);
    }
  }
}
