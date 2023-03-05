import * as duckdb from '@duckdb/duckdb-wasm';

export async function wasmConnector(options) {
  const db = await initDatabase(options);
  const con = await db.connect();

  return {
    db,
    con,
    query: async query => {
      const { type, sql } = query;
      const result = await con.query(sql);
      return type === 'exec' ? undefined
        : type === 'arrow' ? result
        : Array.from(result);
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
