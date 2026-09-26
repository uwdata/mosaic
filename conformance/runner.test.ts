import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Target } from './implementations/index.ts';
import { expandCases, loadCaseDefinitions } from './src/cases.ts';
import type { Harness } from './src/harness.ts';
import { Runner } from './src/runner.ts';
import { startServer, type RunningServer } from './src/server.ts';

describe('target state after a timeout', () => {
  const fixture = path.join(import.meta.dirname, 'fixtures/fake-server.mjs');
  const definitions = loadCaseDefinitions();
  const target = (name: string, transports: Target['transports']): Target => ({
    name, kind: 'server', description: '', capabilities: new Set(['exec']), transports,
    command: port => ({ cmd: process.execPath, args: [fixture, '--port', String(port), '--delay', '400'], cwd: import.meta.dirname })
  });
  const harnessFor = (config: Target): Harness => ({ config, cases: expandCases(definitions, config), known: { server: config.name, own: [], inherited: [] }, expected: new Map() });
  const find = (h: Harness, id: string) => h.cases.find(c => c.id === id)!;

  // A server the suite cannot restart: every timeout, on any transport, is
  // fatal for the rest of the run, and nothing else may be sent.
  describe('an external server', () => {
    let running: RunningServer;
    beforeAll(async () => { running = await startServer(target('fake-external', ['post', 'ws', 'rest'])); }, 30_000);
    afterAll(() => running.stop());

    it('blocks every transport after a REST timeout', async () => {
      const harness = harnessFor(target('fake-external', ['post', 'ws', 'rest']));
      const runner = new Runner(harness, { stepTimeout: 60, url: running.url });
      try {
        expect((await runner.run(find(harness, 'rest/exec-acknowledged'))).map(v => v.id)).toEqual(['s1.connector.no-reply', 's2.blocked.timeout']);
        expect(runner.fatal?.message).toMatch(/rest\/exec-acknowledged step 1 timed out.*cannot be restored/);
        await expect(runner.run(find(harness, 'post/arrow-stream-format'))).rejects.toThrow(/cannot be restored/);
        await expect(runner.run(find(harness, 'ws/arrow-stream-format'))).rejects.toThrow(/cannot be restored/);
      } finally {
        await runner.dispose();
      }
    });

    it('blocks command cases after an HTTP timeout', async () => {
      const harness = harnessFor(target('fake-external', ['post', 'rest']));
      const runner = new Runner(harness, { stepTimeout: 60, url: running.url });
      try {
        await expect(runner.run(find(harness, 'post/exec-acknowledged'))).rejects.toThrow(/no response to POST/);
        expect(runner.fatal?.message).toMatch(/post\/exec-acknowledged step 1 timed out/);
        await expect(runner.run(find(harness, 'rest/sql-parse-error'))).rejects.toThrow(/cannot be restored/);
      } finally {
        await runner.dispose();
      }
    });

    it('records a WebSocket no-reply, blocks the rest of the case, and then everything else', async () => {
      const harness = harnessFor(target('fake-external', ['ws', 'rest']));
      const runner = new Runner(harness, { stepTimeout: 60, url: running.url });
      try {
        expect((await runner.run(find(harness, 'ws/exec-acknowledged'))).map(v => v.id)).toEqual(['s1.ws.no-reply', 's2.blocked.timeout']);
        expect(runner.fatal?.message).toMatch(/ws\/exec-acknowledged step 1 timed out/);
        await expect(runner.run(find(harness, 'rest/sql-parse-error'))).rejects.toThrow(/cannot be restored/);
      } finally {
        await runner.dispose();
      }
    });
  });

  it('restarts a server it started and carries on with a known state', async () => {
    const harness = harnessFor(target('fake-owned', ['post', 'ws', 'rest']));
    const runner = new Runner(harness, { stepTimeout: 60 });
    try {
      await runner.start();
      const before = runner.url();
      expect((await runner.run(find(harness, 'rest/exec-acknowledged'))).map(v => v.id)).toEqual(['s1.connector.no-reply', 's2.blocked.timeout']);
      expect(runner.fatal).toBeUndefined();
      expect(runner.restarts).toBe(1);
      expect(runner.url()).not.toBe(before);
      expect(await runner.run(find(harness, 'post/arrow-stream-format'))).toEqual([]);
      expect(await runner.run(find(harness, 'rest/arrow-stream-format'))).toEqual([]);
      expect((await runner.run(find(harness, 'ws/exec-acknowledged'))).map(v => v.id)).toEqual(['s1.ws.no-reply', 's2.blocked.timeout']);
      expect(runner.restarts).toBe(2);
      expect(await runner.run(find(harness, 'ws/arrow-stream-format'))).toEqual([]);
    } finally {
      await runner.dispose();
    }
  }, 60_000);

  it('replaces an isolated in-process session and keeps going', async () => {
    let built = 0;
    const config: Target = {
      name: 'fake-inproc', kind: 'inproc', description: '', capabilities: new Set(['exec']), transports: ['inproc'],
      session: async () => { built++; const slow = built === 1; return { isolated: true, query: async () => (slow ? new Promise(r => setTimeout(() => r(undefined), 200)) : undefined), dispose: async () => {} }; }
    };
    const harness = harnessFor(config);
    const runner = new Runner(harness, { stepTimeout: 40 });
    try {
      const first = await runner.run(find(harness, 'inproc/exec-acknowledged'));
      expect(first.map(v => v.id)).toEqual(['s1.connector.no-reply', 's2.blocked.timeout']);
      expect(runner.fatal).toBeUndefined();
      const second = await runner.run(find(harness, 'inproc/exec-acknowledged'));
      expect(second.map(v => v.id)).toEqual(['s2.arrow.not-bytes']);
      expect(built).toBe(2);
    } finally {
      await runner.dispose();
    }
  });
});
