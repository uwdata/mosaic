/** @import { Connector } from './Connector.js' */
import * as duckdb from '@duckdb/duckdb-wasm';
import { decodeIPC } from '../util/decode-ipc.js';

/**
 * @typedef {object} DuckDBWASMOptions
 * @property {boolean} [log] Flag to enable logging.
 */

/**
 * @typedef {object} DuckDBWASMConnectorOptions
 * @property {boolean} [log] Flag to enable logging.
 * @property {duckdb.AsyncDuckDB} [duckdb]
 *  Optional pre-existing DuckDB-WASM instance.
 * @property {duckdb.AsyncDuckDBConnection} [connection]
 *  Optional pre-existing DuckDB-WASM connection.
 */

/**
 * Connect to a DuckDB-WASM instance.
 * @param {DuckDBWASMConnectorOptions} options Connector options.
 * @returns {DuckDBWASMConnector} A connector instance.
 */
export function wasmConnector(options = {}) {
  return new DuckDBWASMConnector(options);
}

/**
 * DuckDB-WASM connector.
 * @implements {Connector}
 */
export class DuckDBWASMConnector {
  /**
   * Create a new DuckDB-WASM connector instance.
   * @param {DuckDBWASMConnectorOptions} options
   */
  constructor(options = {}) {
    const { duckdb, connection, ...opts } = options;
    /** @type {DuckDBWASMOptions} */
    this._options = opts;
    /** @type {duckdb.AsyncDuckDB} */
    this._db = duckdb;
    /** @type {duckdb.AsyncDuckDBConnection} */
    this._con = connection;
    /** @type {Promise<unknown>} */
    this._loadPromise;
  }

  /**
   * Get the backing DuckDB-WASM instance.
   * Lazily initializes DuckDB-WASM if not already loaded.
   * @returns {Promise<duckdb.AsyncDuckDB>} The DuckDB-WASM instance.
   */
  async getDuckDB() {
    if (!this._db) await connect(this);
    return this._db;
  }

  /**
   * Get the backing DuckDB-WASM connection.
   * Lazily initializes DuckDB-WASM if not already loaded.
   * @returns {Promise<duckdb.AsyncDuckDBConnection>} The DuckDB-WASM connection.
   */
  async getConnection() {
    if (!this._con) await connect(this);
    return this._con;
  }

  // @ts-ignore
  async query(query) {
    const { type, sql } = query;
    const con = await this.getConnection();
    const result = await getArrowIPC(con, sql);
    return type === 'exec' ? undefined
      : type === 'arrow' ? decodeIPC(result)
      : decodeIPC(result).toArray();
  };
}

/**
 * Bypass duckdb-wasm query method to get Arrow IPC bytes directly.
 * https://github.com/duckdb/duckdb-wasm/issues/267#issuecomment-2252749509
 * @param {duckdb.AsyncDuckDBConnection} con The DuckDB-WASM connection.
 * @param {string} query The SQL query to run.
 */
function getArrowIPC(con, query) {
  return new Promise((resolve, reject) => {
    con.useUnsafe(async (bindings, conn) => {
      try {
        const buffer = await bindings.runQuery(conn, query);
        resolve(buffer);
      } catch (error) {
        reject(error);
      }
    });
  });
}

/**
 * Establish a new database connection for the given connector.
 * @param {DuckDBWASMConnector} c The connector.
 * @returns {Promise<unknown>}
 */
function connect(c) {
  if (!c._loadPromise) {
    // use a loading promise to avoid race conditions
    // synchronizes multiple callees on the same load
    c._loadPromise = (
      c._db
        ? Promise.resolve(c._db)
        : initDatabase(c._options).then(result => c._db = result))
      .then(db => db.connect())
      .then(result => c._con = result);
  }
  return c._loadPromise;
}

/**
 * Initialize a new DuckDB-WASM instance.
 * @param {DuckDBWASMOptions} options
 */
async function initDatabase({
  log = false
} = {}) {
  const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();

  // Select a bundle based on browser checks
  const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);

  const worker_url = URL.createObjectURL(
    new Blob([`importScripts("${bundle.mainWorker}");`], {type: 'text/javascript'})
  );

  // Instantiate the asynchronus version of DuckDB-wasm
  const worker = new Worker(worker_url);
  const logger = log ? new duckdb.ConsoleLogger() : new duckdb.VoidLogger();
  const db = new duckdb.AsyncDuckDB(logger, worker);
  await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
  URL.revokeObjectURL(worker_url);

  return db;
}
