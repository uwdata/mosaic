import type { ExtractionOptions, Table } from '@uwdata/flechette';
import { DuckDB } from '@uwdata/mosaic-duckdb';
import { decodeIPC } from '../util/decode-ipc.js';
import type {
  ArrowQueryRequest,
  Connector,
  ConnectorRequest,
  ExecQueryRequest,
  PreaggRequest,
  PreaggResponse
} from './Connector.js';
import { ConnectorError } from './errors.js';

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
  async query(query: PreaggRequest): Promise<PreaggResponse>;
  async query(query: ConnectorRequest): Promise<unknown> {
    if (query.type === 'preagg') {
      throw new ConnectorError('Unsupported command: preagg', { code: 'unsupported_command' });
    }
    const { type, sql } = query;
    return type === 'exec'
      ? this._db.exec(sql)
      : decodeIPC(await this._db.arrowBuffer(sql), this._ipc);
  }
}
