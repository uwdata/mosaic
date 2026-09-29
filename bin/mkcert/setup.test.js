import assert from 'node:assert/strict';
import { execFileSync, spawn, spawnSync } from 'node:child_process';
import { createHash, X509Certificate } from 'node:crypto';
import { once } from 'node:events';
import { copyFileSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { binaryAsset, reusablePair, setupCertificates, verifyBinary } from './setup.js';

const opensslAvailable = spawnSync('openssl', ['version']).status === 0;

async function temporaryDirectory(t) {
  const directory = await mkdtemp(join(tmpdir(), 'mosaic-mkcert-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  return directory;
}

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
  assert.equal(binaryAsset('win32', 'x64').name, 'mkcert-v1.4.4-windows-amd64.exe');
  assert.throws(() => binaryAsset('freebsd', 'x64'), /install/);
  verifyBinary(Buffer.from('example'), createHash('sha256').update('example').digest('hex'));
  assert.throws(() => verifyBinary(Buffer.from('corrupt'), binaryAsset().hash), /checksum/);
});

test('preserves existing files if mkcert fails to generate replacements', { skip: !opensslAvailable }, async t => {
  const directory = await temporaryDirectory(t);
  const caDirectory = join(directory, 'ca');
  await certificates(caDirectory);
  await writeFile(join(directory, 'localhost.pem'), 'original cert');
  await writeFile(join(directory, 'localhost-key.pem'), 'original key');
  await assert.rejects(setupCertificates({ directory, resolve: async () => 'mkcert', execute: (_, args) => {
    if (args[0] === '-CAROOT') return caDirectory;
    if (args[0] === '-cert-file') throw new Error('generation failed');
  } }), /generation failed/);
  assert.equal(await readFile(join(directory, 'localhost.pem'), 'utf8'), 'original cert');
  assert.equal(await readFile(join(directory, 'localhost-key.pem'), 'utf8'), 'original key');
  assert.ok(!(await readdir(directory)).includes('.setup-lock'));
});

test('renews when the active mkcert CA changes', { skip: !opensslAvailable }, async t => {
  const directory = await temporaryDirectory(t);
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
});

test('serializes setup across processes before checking reuse', { skip: !opensslAvailable, timeout: 10_000 }, async t => {
  const directory = await temporaryDirectory(t);
  const caDirectory = join(directory, 'ca');
  const ca = await certificates(caDirectory);
  const source = `
    import { setupCertificates } from ${JSON.stringify(new URL('./setup.js', import.meta.url).href)};
    import { copyFileSync, appendFileSync } from 'node:fs';
    import fs from 'node:fs/promises';
    import { syncBuiltinESMExports } from 'node:module';
    import { join } from 'node:path';
    const directory = ${JSON.stringify(directory)}, ca = ${JSON.stringify(caDirectory)};
    const mkdir = fs.mkdir;
    fs.mkdir = async (...args) => {
      try { return await mkdir(...args); }
      catch (error) {
        if (error.code === 'EEXIST') process.send('contended');
        throw error;
      }
    };
    syncBuiltinESMExports();
    await setupCertificates({ directory, resolve: async () => 'mkcert', execute: (_, args) => {
      if (args[0] === '-CAROOT') return ca;
      if (args[0] === '-cert-file') {
        appendFileSync(join(directory, 'generations'), 'generated\\n');
        copyFileSync(join(ca, 'localhost.pem'), args[1]);
        copyFileSync(join(ca, 'localhost-key.pem'), args[3]);
      }
    }});
    process.disconnect();
  `;
  const locked = Promise.withResolvers(), release = Promise.withResolvers();
  t.after(() => release.resolve());
  const holder = setupCertificates({ directory, resolve: async () => {
    locked.resolve();
    await release.promise;
    throw new Error('holder released');
  } });
  const holderDone = assert.rejects(holder, /holder released/);
  await locked.promise;
  const waiter = spawn(process.execPath, ['--input-type=module', '-e', source], { stdio: ['ignore', 'ignore', 'inherit', 'ipc'] });
  t.after(() => waiter.kill());
  const waiterClosed = once(waiter, 'close');
  assert.equal((await once(waiter, 'message'))[0], 'contended');
  release.resolve();
  await holderDone;
  assert.equal((await waiterClosed)[0], 0);
  assert.equal(await readFile(join(directory, 'generations'), 'utf8'), 'generated\n');
  assert.ok(await reusablePair(directory, ca));
});
