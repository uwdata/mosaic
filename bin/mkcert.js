import { spawnSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { certificateDirectory } from '../packages/server/duckdb/src/https.js';

function mkcert(args) {
  const result = spawnSync('mkcert', args, { stdio: 'inherit' });
  if (result.error?.code === 'ENOENT') {
    throw new Error('Install native mkcert on PATH: https://github.com/FiloSottile/mkcert');
  }
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error('mkcert failed; see output above.');
}

try {
  const directory = certificateDirectory();
  if (!directory) throw new Error('Unable to determine the user configuration directory.');
  mkcert(['-install']);
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  mkcert([
    '-cert-file', join(directory, 'localhost.pem'),
    '-key-file', join(directory, 'localhost-key.pem'),
    'localhost', '127.0.0.1', '::1'
  ]);
  console.log(`Localhost certificates ready in ${directory}`);
  console.log('Start a Mosaic server, then connect to https://localhost:3000.');
  console.log('Restart running servers to load renewed certificates.');
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
