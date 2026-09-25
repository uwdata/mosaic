import path from 'node:path';
import { loadCases, repoRoot } from '../src/cases.ts';
import type { Session } from '../src/session.ts';
import { nodeSession, wasmSession } from './inproc.ts';
import type { Capability, Transport } from '../src/types.ts';

export interface ServerCommand {
  cmd: string;
  args: string[];
  cwd: string;
  env?: Record<string, string>;
}

// A target is one thing the suite can be pointed at. A `server` is spawned
// in global setup and reached over the wire; an `inproc` target is a
// `Connector` built inside the test worker; a `comm` target speaks the
// widget's message protocol to a subprocess. `transports` run the whole
// corpus; `smoke` transports run only cases tagged `smoke: true`.
export interface Target {
  name: string;
  kind: 'server' | 'inproc' | 'comm';
  description: string;
  capabilities: Set<Capability>;
  transports: Transport[];
  smoke?: Transport[];
  command?: (port: number) => ServerCommand;
  session?: (url: string | undefined) => Promise<Session>;
}

// Every server accepts `--port`, so an adapter is just the launcher plus any
// implementation-specific flags appended after it.
const core = (port: number) => ['--port', String(port)];

function launcher(cmd: string, prefix: string[], cwd: string, flags: string[] = []) {
  return (port: number): ServerCommand => ({ cmd, args: [...prefix, ...core(port), ...flags], cwd });
}

const wire: Transport[] = ['post', 'get', 'ws'];
const clients: Transport[] = ['rest', 'socket'];

function server(
  name: string,
  description: string,
  capabilities: Capability[],
  command: (port: number) => ServerCommand,
  extra: Pick<Target, 'transports' | 'smoke'> = { transports: wire, smoke: clients }
): Target {
  return { name, kind: 'server', description, capabilities: new Set(capabilities), command, ...extra };
}

const goDir = path.join(repoRoot, 'packages/server/duckdb-server-go');
const goRun = ['run', '-tags=duckdb_arrow', '.'];

export const targets: Record<string, Target> = {
  node: server(
    'node',
    '`@uwdata/mosaic-duckdb` data server (`packages/server/duckdb`)',
    ['exec', 'files'],
    launcher(process.execPath, ['packages/server/duckdb/bin/run-server.js'], repoRoot)
  ),
  python: server(
    'python',
    '`duckdb-server` (`packages/server/duckdb-server`)',
    ['exec', 'files'],
    launcher('uv', ['run', 'duckdb-server'], path.join(repoRoot, 'packages/server/duckdb-server'))
  ),
  rust: server(
    'rust',
    '`duckdb-server` crate (`packages/server/duckdb-server-rust`)',
    ['exec', 'files'],
    launcher('cargo', ['run', '--quiet', '--'], path.join(repoRoot, 'packages/server/duckdb-server-rust'))
  ),
  // The reference server also runs the whole command corpus through the real
  // client connectors; the others run the smoke subset over them.
  go: server(
    'go',
    '`duckdb-server-go` with default flags',
    ['exec', 'files'],
    launcher('go', goRun, goDir),
    { transports: [...wire, ...clients] }
  ),
  'go-cache': server(
    'go-cache',
    '`duckdb-server-go --cache-control=\'public, max-age=60\'`',
    ['exec', 'files', 'caching'],
    launcher('go', goRun, goDir, ['--cache-control', 'public, max-age=60'])
  ),
  'go-gatekeeper': server(
    'go-gatekeeper',
    '`duckdb-server-go --gatekeeper=\'{"version":1,"options":{}}\'`; validation disables `exec` and denies local file access',
    ['policy'],
    launcher('go', goRun, goDir, ['--gatekeeper', '{"version":1,"options":{}}'])
  ),
  'node-connector': {
    name: 'node-connector',
    kind: 'inproc',
    description: '`NodeConnector` (`@uwdata/mosaic-core/node-connector`) over an in-process `@uwdata/mosaic-duckdb` database',
    capabilities: new Set(['exec', 'files']),
    transports: ['inproc'],
    session: () => nodeSession()
  },
  wasm: {
    name: 'wasm',
    kind: 'inproc',
    description: '`DuckDBWASMConnector` (`packages/mosaic/core/src/connectors/wasm.ts`) on the duckdb-wasm Node bundle in a worker thread, with `data/*.parquet` registered in its virtual file system',
    capabilities: new Set(['exec', 'files']),
    transports: ['inproc'],
    session: () => wasmSession()
  }
};

export function target(name: string | undefined): Target {
  if (!name) {
    throw new Error(`CONFORMANCE_TARGET is not set; choose one of ${Object.keys(targets).join(', ')}`);
  }
  const found = targets[name];
  if (!found) throw new Error(`unknown target ${name}; choose one of ${Object.keys(targets).join(', ')}`);
  return found;
}

export const casesOf = (name: string) => new Set(loadCases(target(name)).map(c => c.id));
