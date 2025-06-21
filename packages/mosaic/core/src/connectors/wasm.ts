import type { ExtractionOptions, Table } from '@uwdata/flechette';
import type { ArrowQueryRequest, Connector, ExecQueryRequest, JSONQueryRequest } from './Connector.js';
import * as duckdb from '@duckdb/duckdb-wasm';
import { decodeIPC } from '../util/decode-ipc.js';

interface DuckDBWASMOptions {
  /** Flag to enable logging. */
  log?: boolean;
}

interface DuckDBWASMConnectorOptions extends DuckDBWASMOptions {
  /** Arrow IPC extraction options. */
  ipc?: ExtractionOptions;
  /** Optional pre-existing DuckDB-WASM instance. */
  duckdb?: duckdb.AsyncDuckDB;
  /** Optional pre-existing DuckDB-WASM connection. */
  connection?: duckdb.AsyncDuckDBConnection;
}

/**
 * Connect to a DuckDB-WASM instance.
 * @param options Connector options.
 * @returns A connector instance.
 */
export function wasmConnector(options: DuckDBWASMConnectorOptions = {}): DuckDBWASMConnector {
  return new DuckDBWASMConnector(options);
}

/**
 * DuckDB-WASM connector.
 */
export class DuckDBWASMConnector implements Connector {
  private _ipc?: ExtractionOptions;
  public _options: DuckDBWASMOptions;
  public _db?: duckdb.AsyncDuckDB;
  public _con?: duckdb.AsyncDuckDBConnection;
  public _loadPromise?: Promise<unknown>;

  /**
   * Create a new DuckDB-WASM connector instance.
   * @param options Connector options.
   */
  constructor(options: DuckDBWASMConnectorOptions = {}) {
    const { ipc, duckdb, connection, ...opts } = options;
    this._ipc = ipc;
    this._options = opts;
    this._db = duckdb;
    this._con = connection;
  }

  /**
   * Get the backing DuckDB-WASM instance.
   * Lazily initializes DuckDB-WASM if not already loaded.
   * @returns The DuckDB-WASM instance.
   */
  async getDuckDB(): Promise<duckdb.AsyncDuckDB> {
    if (!this._db) await connect(this);
    return this._db!;
  }

  /**
   * Get the backing DuckDB-WASM connection.
   * Lazily initializes DuckDB-WASM if not already loaded.
   * @returns The DuckDB-WASM connection.
   */
  async getConnection(): Promise<duckdb.AsyncDuckDBConnection> {
    if (!this._con) await connect(this);
    return this._con!;
  }

  async query(query: ArrowQueryRequest): Promise<Table>;
  async query(query: ExecQueryRequest): Promise<void>;
  async query(query: JSONQueryRequest): Promise<Record<string, any>[]>;
  async query(query: ArrowQueryRequest | ExecQueryRequest | JSONQueryRequest): Promise<Table | void | Record<string, any>[]>;
  async query(query: any): Promise<any> {
    const { type, sql } = query;
    const con = await this.getConnection();
    const result = await getArrowIPC(con, sql);
    return type === 'exec' ? undefined
      : type === 'arrow' ? decodeIPC(result, this._ipc)
      : decodeIPC(result).toArray();
  }
}

/**
 * Bypass duckdb-wasm query method to get Arrow IPC bytes directly.
 * https://github.com/duckdb/duckdb-wasm/issues/267#issuecomment-2252749509
 * @param con The DuckDB-WASM connection.
 * @param query The SQL query to run.
 */
function getArrowIPC(con: duckdb.AsyncDuckDBConnection, query: string): Promise<ArrayBuffer> {
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
 * @param c The connector.
 * @returns Connection promise.
 */
function connect(c: DuckDBWASMConnector): Promise<unknown> {
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
 * @param options Database initialization options.
 */
async function initDatabase({
  log = false
}: DuckDBWASMOptions = {}): Promise<duckdb.AsyncDuckDB> {
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