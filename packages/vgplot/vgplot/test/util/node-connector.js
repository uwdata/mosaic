import { DuckDB } from '@uwdata/mosaic-duckdb';
import { decodeIPC } from '@uwdata/mosaic-core';

/**
 * A Mosaic Connector backed by an in-process Node.js DuckDB instance.
 */
export class NodeConnector {
  /** @type {DuckDB} */
  _db;
  /** @type {any} */
  _ipc;

  /**
   * @param {DuckDB} [db]
   * @param {any} [ipc]
   */
  static async make(db, ipc) {
    const connector = new NodeConnector(db, ipc);
    // make sure initialization is complete
    await connector._db._init;
    return connector;
  }

  /**
   * @param {DuckDB} [db]
   * @param {any} [ipc]
   */
  constructor(db = new DuckDB(), ipc) {
    this._db = db;
    this._ipc = ipc;
  }

  /**
   * Query an in-process DuckDB instance.
   * @param {import('@uwdata/mosaic-core').ConnectorQueryRequest} query
   * @returns {Promise<any>}
   */
  async query(query) {
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
