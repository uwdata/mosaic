import { readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import type { AsyncDuckDB } from '@duckdb/duckdb-wasm';
import { wasmConnector } from '@uwdata/mosaic-core';
import { NodeConnector } from '@uwdata/mosaic-core/node-connector';
import WebWorker from 'web-worker';
import { repoRoot } from '../src/cases.ts';
import type { Session } from '../src/session.ts';

const dataDir = path.join(repoRoot, 'data');

export async function nodeSession(): Promise<Session> {
  const connector = await NodeConnector.make();
  return {
    isolated: true,
    query: request => connector.query(request as never),
    dispose: async () => { (connector as unknown as { _db: { close(): void } })._db.close(); }
  };
}

// The connector's own bootstrap fetches a browser bundle and spawns a web
// Worker, so the instance is built here from the Node bundle instead and
// handed in through the options; everything after that is wasm.ts. The
// bundle wants a browser-style worker object, which web-worker 1.2 provides
// over worker_threads (1.3+ evaluates classic workers without `module`, and
// the DuckDB worker script is CommonJS). Fixture files are registered under
// their real absolute paths so `$DATA/` cases read the same SQL everywhere.
export async function wasmSession(): Promise<Session> {
  const require = createRequire(import.meta.url);
  const entry = require.resolve('@duckdb/duckdb-wasm/dist/duckdb-node.cjs');
  const dist = path.dirname(entry);
  const duckdb = require(entry) as typeof import('@duckdb/duckdb-wasm');
  const worker = new WebWorker(path.join(dist, 'duckdb-node-eh.worker.cjs'));
  const db: AsyncDuckDB = new duckdb.AsyncDuckDB(new duckdb.VoidLogger(), worker as never);
  await db.instantiate(path.join(dist, 'duckdb-eh.wasm'));
  for (const file of readdirSync(dataDir).filter(f => f.endsWith('.parquet'))) {
    const full = path.join(dataDir, file);
    await db.registerFileBuffer(full, new Uint8Array(readFileSync(full)));
  }
  const connector = wasmConnector({ duckdb: db });
  return {
    isolated: true,
    query: request => connector.query(request as never),
    dispose: async () => { await db.terminate(); }
  };
}
