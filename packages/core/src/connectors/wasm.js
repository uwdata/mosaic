import * as duckdb from '@duckdb/duckdb-wasm';
import { decodeIPC } from '../util/decode-ipc.js';

// bypass duckdb-wasm query method to get Arrow IPC bytes directly
// https://github.com/duckdb/duckdb-wasm/issues/267#issuecomment-2252749509
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

export function wasmConnector(options = {}) {
  const { duckdb, connection, ...opts } = options;
  let db = duckdb;
  let con = connection;
  let loadPromise;

  function load() {
    if (!loadPromise) {
      // use a loading promise to avoid race conditions
      // synchronizes multiple callees on the same load
      loadPromise = (db
        ? Promise.resolve(db)
        : initDatabase(opts).then(result => db = result))
        .then(db => db.connect())
        .then(result => con = result);
    }
    return loadPromise;
  }

  /**
   * Get the backing DuckDB-WASM instance.
   * Will lazily initialize DuckDB-WASM if not already loaded.
   * @returns {Promise<duckdb.AsyncDuckDB>} The DuckDB-WASM instance.
   */
  async function getDuckDB() {
    if (!db) await load();
    return db;
  }

  /**
   * Get the backing DuckDB-WASM connection.
   * Will lazily initialize DuckDB-WASM if not already loaded.
   * @returns {Promise<duckdb.AsyncDuckDBConnection>} The DuckDB-WASM connection.
   */
  async function getConnection() {
    if (!con) await load();
    return con;
  }

  return {
    getDuckDB,
    getConnection,
    /**
     * Query the DuckDB-WASM instance.
     * @param {object} query
     * @param {'exec' | 'arrow' | 'json'} [query.type] The query type.
     * @param {string} query.sql A SQL query string.
     * @returns the query result
     */
    query: async query => {
      const { type, sql } = query;
      const con = await getConnection();
      const result = await getArrowIPC(con, sql);
      return type === 'exec' ? undefined
        : type === 'arrow' ? decodeIPC(result)
        : decodeIPC(result).toArray();
    }
  };
}

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
