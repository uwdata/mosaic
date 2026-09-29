import { spawnSync } from 'node:child_process';
import { createHash, createPrivateKey, X509Certificate } from 'node:crypto';
import { chmod, mkdir, mkdtemp, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { setTimeout } from 'node:timers/promises';
import { userDirectories } from '../../packages/server/duckdb/src/https.js';

const version = 'v1.4.4';
const hashes = {
  'darwin-amd64': 'a32dfab51f1845d51e810db8e47dcf0e6b51ae3422426514bf5a2b8302e97d4e',
  'darwin-arm64': 'c8af0df44bce04359794dad8ea28d750437411d632748049d08644ffb66a60c6',
  'linux-amd64': '6d31c65b03972c6dc4a14ab429f2928300518b26503f58723e532d1b0a3bbb52',
  'linux-arm': '2f22ff62dfc13357e147e027117724e7ce1ff810e30d2b061b05b668ecb4f1d7',
  'linux-arm64': 'b98f2cc69fd9147fe4d405d859c57504571adec0d3611c3eefd04107c7ac00d0',
  'windows-amd64.exe': 'd2660b50a9ed59eada480750561c96abc2ed4c9a38c6a24d93e30e0977631398',
  'windows-arm64.exe': '793747256c562622d40127c8080df26add2fb44c50906ce9db63b42a5280582e'
};

export function binaryAsset(platform = process.platform, arch = process.arch) {
  const target = `${platform === 'win32' ? 'windows' : platform}-${arch === 'x64' ? 'amd64' : arch}${platform === 'win32' ? '.exe' : ''}`;
  const hash = hashes[target];
  if (!hash) throw new Error(`No bundled mkcert for ${platform}/${arch}; install https://github.com/FiloSottile/mkcert and rerun pnpm mkcert.`);
  return { name: `mkcert-${version}-${target}`, hash };
}

export function verifyBinary(data, hash) {
  if (createHash('sha256').update(data).digest('hex') !== hash) {
    throw new Error('mkcert binary checksum mismatch');
  }
}

export async function resolveMkcert(cache = userDirectories().binaries) {
  const installed = spawnSync('mkcert', ['-version'], { stdio: 'ignore' });
  if (!installed.error && installed.status === 0) return 'mkcert';
  if (!cache) throw new Error('Unable to determine the user cache directory; install mkcert on PATH.');
  const { name, hash } = binaryAsset();
  const executable = join(cache, name);
  try {
    verifyBinary(await readFile(executable), hash);
    return executable;
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  console.log(`Downloading mkcert ${version} from GitHub...`);
  const response = await fetch(`https://github.com/FiloSottile/mkcert/releases/download/${version}/${name}`);
  if (!response.ok) throw new Error(`mkcert download failed: HTTP ${response.status}`);
  const data = Buffer.from(await response.arrayBuffer());
  verifyBinary(data, hash);
  await mkdir(cache, { recursive: true, mode: 0o700 });
  const temporary = await mkdtemp(join(cache, '.download-'));
  try {
    const file = join(temporary, name);
    await writeFile(file, data, { mode: 0o700 });
    await rename(file, executable);
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
  return executable;
}

export async function reusablePair(directory, ca, now = Date.now()) {
  try {
    const cert = new X509Certificate(await readFile(join(directory, 'localhost.pem')));
    const key = createPrivateKey(await readFile(join(directory, 'localhost-key.pem')));
    return cert.checkPrivateKey(key)
      && ca.ca
      && cert.checkIssued(ca)
      && cert.verify(ca.publicKey)
      && Date.parse(ca.validFrom) <= now
      && Date.parse(ca.validTo) > now + 30 * 24 * 60 * 60 * 1000
      && Date.parse(cert.validFrom) <= now
      && Date.parse(cert.validTo) > now + 30 * 24 * 60 * 60 * 1000
      && !!cert.checkHost('localhost')
      && !!cert.checkIP('127.0.0.1')
      && !!cert.checkIP('::1');
  } catch {
    return false;
  }
}

function run(executable, args, capture = false) {
  const result = spawnSync(executable, args, {
    stdio: capture ? ['inherit', 'pipe', 'inherit'] : 'inherit',
    encoding: 'utf8'
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`mkcert ${args[0]} failed; check the output above and system/NSS trust permissions.`);
  return result.stdout;
}

async function acquireLock(directory) {
  const lock = join(directory, '.setup-lock');
  const deadline = Date.now() + 120_000;
  for (;;) {
    try {
      await mkdir(lock, { mode: 0o700 });
      return () => rm(lock, { recursive: true });
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
      if (Date.now() >= deadline) {
        throw new Error(`Certificate setup is locked at ${lock}. Wait for the other setup process, or remove this directory only after confirming it is no longer running.`, { cause: error });
      }
      await setTimeout(100);
    }
  }
}

export async function setupCertificates({
  directory = userDirectories().certificates,
  resolve = resolveMkcert,
  execute = run
} = {}) {
  if (!directory) throw new Error('Unable to determine the user configuration directory.');
  await mkdir(directory, { recursive: true, mode: 0o700 });
  await chmod(directory, 0o700);
  const release = await acquireLock(directory);
  try {
    const executable = await resolve();
    execute(executable, ['-install']);
    const caDirectory = execute(executable, ['-CAROOT'], true).trim();
    if (!caDirectory) throw new Error('mkcert did not report its CA directory');
    const ca = new X509Certificate(await readFile(join(caDirectory, 'rootCA.pem')));
    if (!await reusablePair(directory, ca)) {
      const temporary = await mkdtemp(join(directory, '.certificate-'));
      try {
        execute(executable, [
          '-cert-file', join(temporary, 'localhost.pem'),
          '-key-file', join(temporary, 'localhost-key.pem'),
          'localhost', '127.0.0.1', '::1'
        ]);
        if (!await reusablePair(temporary, ca)) throw new Error('mkcert generated an invalid localhost certificate pair for its active CA');
        for (const name of ['localhost.pem', 'localhost-key.pem']) {
          await chmod(join(temporary, name), 0o600);
          await rename(join(temporary, name), join(directory, name));
        }
      } finally {
        await rm(temporary, { recursive: true, force: true });
      }
    }
    await chmod(join(directory, 'localhost-key.pem'), 0o600);
    return directory;
  } finally {
    await release();
  }
}
