import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { binaryAsset, setupCertificates, verifyBinary } from './setup.js';

test('selects pinned upstream assets and rejects incorrect checksums', () => {
  for (const [platform, arch] of [['darwin', 'x64'], ['darwin', 'arm64'], ['linux', 'x64'], ['linux', 'arm'], ['linux', 'arm64'], ['win32', 'x64'], ['win32', 'arm64']]) {
    assert.match(binaryAsset(platform, arch).hash, /^[a-f0-9]{64}$/);
  }
  assert.equal(binaryAsset('win32', 'x64').name, 'mkcert-v1.4.4-windows-amd64.exe');
  assert.throws(() => binaryAsset('freebsd', 'x64'), /install/);
  verifyBinary(Buffer.from('example'), createHash('sha256').update('example').digest('hex'));
  assert.throws(() => verifyBinary(Buffer.from('corrupt'), binaryAsset().hash), /checksum/);
});

test('preserves existing files if mkcert fails to generate replacements', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'mosaic-mkcert-'));
  try {
    await writeFile(join(directory, 'localhost.pem'), 'original cert');
    await writeFile(join(directory, 'localhost-key.pem'), 'original key');
    const calls = [];
    await assert.rejects(setupCertificates({ directory, resolve: async () => 'mkcert', execute: (binary, args) => {
      assert.equal(binary, 'mkcert');
      calls.push(args);
      if (args[0] === '-cert-file') {
        assert.deepEqual(args.slice(4), ['localhost', '127.0.0.1', '::1']);
        throw new Error('generation failed');
      }
    } }), /generation failed/);
    assert.deepEqual(calls[0], ['-install']);
    assert.equal(await readFile(join(directory, 'localhost.pem'), 'utf8'), 'original cert');
    assert.equal(await readFile(join(directory, 'localhost-key.pem'), 'utf8'), 'original key');
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
