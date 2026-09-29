import assert from 'node:assert/strict';
import { execFileSync, spawn, spawnSync } from 'node:child_process';
import { createHash, X509Certificate } from 'node:crypto';
import { copyFileSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { binaryAsset, reusablePair, setupCertificates, verifyBinary } from './setup.js';

const opensslAvailable = spawnSync('openssl', ['version']).status === 0;

async function certificates(directory) {
  await mkdir(directory, { recursive: true });
  const run = args => execFileSync('openssl', args, { cwd: directory, stdio: 'ignore' });
  run(['req', '-x509', '-newkey', 'ec', '-pkeyopt', 'ec_paramgen_curve:P-256', '-nodes', '-keyout', 'ca-key.pem', '-out', 'rootCA.pem', '-days', '365', '-subj', '/CN=Test CA', '-addext', 'basicConstraints=critical,CA:TRUE']);
  run(['req', '-new', '-newkey', 'ec', '-pkeyopt', 'ec_paramgen_curve:P-256', '-nodes', '-keyout', 'localhost-key.pem', '-out', 'leaf.csr', '-subj', '/CN=localhost']);
  await writeFile(join(directory, 'extensions'), 'subjectAltName=DNS:localhost,IP:127.0.0.1,IP:::1\nbasicConstraints=CA:FALSE\n');
  run(['x509', '-req', '-in', 'leaf.csr', '-CA', 'rootCA.pem', '-CAkey', 'ca-key.pem', '-CAcreateserial', '-out', 'localhost.pem', '-days', '90', '-extfile', 'extensions']);
  return new X509Certificate(await readFile(join(directory, 'rootCA.pem')));
}

test('selects pinned upstream assets and rejects incorrect checksums', () => {
  for (const [platform, arch] of [['darwin', 'x64'], ['darwin', 'arm64'], ['linux', 'x64'], ['linux', 'arm'], ['linux', 'arm64'], ['win32', 'x64'], ['win32', 'arm64']]) {
    assert.match(binaryAsset(platform, arch).hash, /^[a-f0-9]{64}$/);
  }
  assert.equal(binaryAsset('win32', 'x64').name, 'mkcert-v1.4.4-windows-amd64.exe');
  assert.throws(() => binaryAsset('freebsd', 'x64'), /install/);
  verifyBinary(Buffer.from('example'), createHash('sha256').update('example').digest('hex'));
  assert.throws(() => verifyBinary(Buffer.from('corrupt'), binaryAsset().hash), /checksum/);
});

test('preserves existing files if mkcert fails to generate replacements', { skip: !opensslAvailable }, async () => {
  const directory = await mkdtemp(join(tmpdir(), 'mosaic-mkcert-'));
  try {
    const caDirectory = join(directory, 'ca');
    await certificates(caDirectory);
    await writeFile(join(directory, 'localhost.pem'), 'original cert');
    await writeFile(join(directory, 'localhost-key.pem'), 'original key');
    const calls = [];
    await assert.rejects(setupCertificates({ directory, resolve: async () => 'mkcert', execute: (binary, args) => {
      assert.equal(binary, 'mkcert');
      calls.push(args);
      if (args[0] === '-CAROOT') return caDirectory;
      if (args[0] === '-cert-file') {
        assert.deepEqual(args.slice(4), ['localhost', '127.0.0.1', '::1']);
        throw new Error('generation failed');
      }
    } }), /generation failed/);
    assert.deepEqual(calls[0], ['-install']);
    assert.equal(await readFile(join(directory, 'localhost.pem'), 'utf8'), 'original cert');
    assert.equal(await readFile(join(directory, 'localhost-key.pem'), 'utf8'), 'original key');
    assert.ok(!(await readdir(directory)).includes('.setup-lock'));
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('renews when the active mkcert CA changes', { skip: !opensslAvailable }, async () => {
  const directory = await mkdtemp(join(tmpdir(), 'mosaic-ca-replacement-'));
  try {
    const first = join(directory, 'ca-a'), second = join(directory, 'ca-b');
    const caA = await certificates(first), caB = await certificates(second);
    let active = first, generations = 0;
    const options = { directory, resolve: async () => 'mkcert', execute: (_, args) => {
      if (args[0] === '-CAROOT') return `${active}\n`;
      if (args[0] === '-cert-file') {
        ++generations;
        copyFileSync(join(active, 'localhost.pem'), args[1]);
        copyFileSync(join(active, 'localhost-key.pem'), args[3]);
      }
    } };
    await setupCertificates(options);
    assert.ok(await reusablePair(directory, caA));
    await setupCertificates(options);
    assert.equal(generations, 1);
    active = second;
    await setupCertificates(options);
    assert.equal(generations, 2);
    assert.ok(await reusablePair(directory, caB));
    assert.equal(await reusablePair(directory, caA), false);
    assert.equal(await reusablePair(directory, caB, Date.now() + 65 * 86400000), false);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('serializes setup across processes before checking reuse', { skip: !opensslAvailable }, async () => {
  const directory = await mkdtemp(join(tmpdir(), 'mosaic-concurrent-'));
  try {
    const caDirectory = join(directory, 'ca');
    const ca = await certificates(caDirectory);
    const source = `
      import { setupCertificates } from ${JSON.stringify(new URL('./setup.js', import.meta.url).href)};
      import { mkdirSync, rmdirSync, copyFileSync, appendFileSync } from 'node:fs';
      import { join } from 'node:path';
      const directory = ${JSON.stringify(directory)}, ca = ${JSON.stringify(caDirectory)};
      await setupCertificates({ directory, resolve: async () => 'mkcert', execute: (_, args) => {
        if (args[0] === '-install') {
          mkdirSync(join(directory, 'active'));
          Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 50);
          rmdirSync(join(directory, 'active'));
        }
        if (args[0] === '-CAROOT') return ca;
        if (args[0] === '-cert-file') {
          appendFileSync(join(directory, 'generations'), 'generated\\n');
          copyFileSync(join(ca, 'localhost.pem'), args[1]);
          copyFileSync(join(ca, 'localhost-key.pem'), args[3]);
        }
      }});
    `;
    const runs = Array.from({ length: 8 }, () => new Promise((resolve, reject) => {
      const child = spawn(process.execPath, ['--input-type=module', '-e', source]);
      let stderr = '';
      child.stderr.on('data', data => stderr += data);
      child.on('error', reject);
      child.on('close', code => code === 0 ? resolve() : reject(new Error(stderr)));
    }));
    const results = await Promise.allSettled(runs);
    for (const result of results) assert.equal(result.status, 'fulfilled', result.reason?.message);
    assert.equal(await readFile(join(directory, 'generations'), 'utf8'), 'generated\n');
    assert.ok(await reusablePair(directory, ca));
    assert.ok(!(await readdir(directory)).includes('.setup-lock'));
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
