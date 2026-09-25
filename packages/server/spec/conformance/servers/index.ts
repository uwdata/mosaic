import path from 'node:path';
import { repoRoot } from '../src/cases.ts';
import type { Capability } from '../src/types.ts';

export interface ServerCommand {
  cmd: string;
  args: string[];
  cwd: string;
  env?: Record<string, string>;
}

export interface ServerConfig {
  name: string;
  description: string;
  capabilities: Set<Capability>;
  command: (port: number) => ServerCommand;
}

// Every server accepts `--port`, so an adapter is just the launcher plus any
// implementation-specific flags appended after it.
const core = (port: number) => ['--port', String(port)];

function launcher(cmd: string, prefix: string[], cwd: string, flags: string[] = []) {
  return (port: number): ServerCommand => ({ cmd, args: [...prefix, ...core(port), ...flags], cwd });
}

const goDir = path.join(repoRoot, 'packages/server/duckdb-server-go');
const goRun = ['run', '-tags=duckdb_arrow', '.'];

function goConfig(name: string, description: string, flags: string[], capabilities: Capability[]): ServerConfig {
  return { name, description, capabilities: new Set(capabilities), command: launcher('go', goRun, goDir, flags) };
}

export const servers: Record<string, ServerConfig> = {
  node: {
    name: 'node',
    description: '`@uwdata/mosaic-duckdb` data server (`packages/server/duckdb`)',
    capabilities: new Set(['exec', 'files']),
    command: launcher(process.execPath, ['packages/server/duckdb/bin/run-server.js'], repoRoot)
  },
  python: {
    name: 'python',
    description: '`duckdb-server` (`packages/server/duckdb-server`)',
    capabilities: new Set(['exec', 'files']),
    command: launcher('uv', ['run', 'duckdb-server'], path.join(repoRoot, 'packages/server/duckdb-server'))
  },
  rust: {
    name: 'rust',
    description: '`duckdb-server` crate (`packages/server/duckdb-server-rust`)',
    capabilities: new Set(['exec', 'files']),
    command: launcher('cargo', ['run', '--quiet', '--'], path.join(repoRoot, 'packages/server/duckdb-server-rust'))
  },
  go: goConfig('go', '`duckdb-server-go` with default flags', [], ['exec', 'files']),
  'go-cache': goConfig(
    'go-cache',
    '`duckdb-server-go --cache-control=\'public, max-age=60\'`',
    ['--cache-control', 'public, max-age=60'],
    ['exec', 'files', 'caching']
  ),
  'go-gatekeeper': goConfig(
    'go-gatekeeper',
    '`duckdb-server-go --gatekeeper=\'{"version":1,"options":{}}\'`; validation disables `exec` and local file access',
    ['--gatekeeper', '{"version":1,"options":{}}'],
    []
  )
};

export function serverConfig(name: string | undefined): ServerConfig {
  if (!name) {
    throw new Error(`CONFORMANCE_SERVER is not set; choose one of ${Object.keys(servers).join(', ')}`);
  }
  const config = servers[name];
  if (!config) throw new Error(`unknown server ${name}; choose one of ${Object.keys(servers).join(', ')}`);
  return config;
}
