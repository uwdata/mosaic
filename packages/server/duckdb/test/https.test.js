import { afterEach, describe, expect, it } from 'vitest';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { findCertificates, certificateDirectory } from '../src/https.js';

const directories = [];
afterEach(() => directories.splice(0).forEach(dir => rmSync(dir, { recursive: true, force: true })));

describe('certificate discovery', () => {
  it('uses matching OS configuration conventions', () => {
    expect(certificateDirectory('darwin', {}, '/home/test')).toBe('/home/test/Library/Application Support/mosaic/https');
    expect(certificateDirectory('linux', {}, '/home/test')).toBe('/home/test/.config/mosaic/https');
    expect(certificateDirectory('linux', { XDG_CONFIG_HOME: '/config' }, '/home/test')).toBe('/config/mosaic/https');
    expect(certificateDirectory('win32', { APPDATA: 'C:\\Roaming' }, '')).toBe('C:\\Roaming\\mosaic\\https');
    expect(certificateDirectory('win32', {}, '')).toBeUndefined();
  });

  it('prefers local complete pairs without mixing directories', () => {
    const root = mkdtempSync(join(tmpdir(), 'mosaic-https-'));
    directories.push(root);
    const local = join(root, 'local'), shared = join(root, 'shared');
    mkdirSync(local);
    mkdirSync(shared);
    expect(findCertificates(local, shared)).toBeUndefined();
    writeFileSync(join(local, 'localhost.pem'), 'local');
    writeFileSync(join(shared, 'localhost-key.pem'), 'shared');
    expect(findCertificates(local, shared)).toBeUndefined();
    writeFileSync(join(shared, 'localhost.pem'), 'shared');
    expect(findCertificates(local, shared)?.cert).toBe(join(shared, 'localhost.pem'));
    writeFileSync(join(local, 'localhost-key.pem'), 'local');
    expect(findCertificates(local, shared)?.cert).toBe(join(local, 'localhost.pem'));
  });
});
