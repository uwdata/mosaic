import path from 'node:path';
import { describe, expect, it } from 'vitest';
import type { Target } from './implementations/index.ts';
import { startServer } from './src/server.ts';

const fixture = path.join(import.meta.dirname, 'fixtures/fake-server.mjs');
const target = (name: string, ...extra: string[]): Target => ({
  name, kind: 'server', description: '', capabilities: new Set(), transports: ['post'],
  command: port => ({ cmd: process.execPath, args: [fixture, '--port', String(port), ...extra], cwd: import.meta.dirname })
});
const alive = (pid: number) => { try { process.kill(pid, 0); return true; } catch { return false; } };

describe('server startup', () => {
  it('reports a plain-HTTP server ready', async () => {
    const running = await startServer(target('fake-http'));
    try {
      expect(running.url).toMatch(/^http:\/\/127\.0\.0\.1:\d+\/$/);
      expect((await fetch(running.url, { method: 'POST', body: '{"type":"arrow","sql":"SELECT 1"}' })).status).toBe(200);
    } finally {
      await running.stop();
    }
  }, 30_000);

  // Node and Rust close the socket on a plaintext hello; Go answers it with a
  // plain 400 first. Both must fail startup, and neither may leave a server
  // behind for the suite to record protocol failures against.
  it.each(['close', 'plaintext-400'])('refuses a server that speaks TLS (%s) instead of declaring it ready', async mode => {
    await expect(startServer(target(`fake-tls-${mode}`, '--tls', mode), { readyTimeout: 20_000 })).rejects.toThrow(/answered .* with TLS: it found a localhost certificate pair/);
  }, 30_000);

  it('stops the process and reports only once it has exited', async () => {
    const running = await startServer(target('fake-stop'));
    expect(alive(running.pid)).toBe(true);
    await running.stop();
    expect(alive(running.pid)).toBe(false);
    await expect(fetch(running.url, { method: 'POST', body: '{}' })).rejects.toThrow();
  }, 30_000);
});
