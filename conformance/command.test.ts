import { int32, tableFromArrays, tableToIPC } from '@uwdata/flechette';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { captureValues, checkResponse, ipcBytes } from './src/check.ts';
import { parseSkipNote, skipNote } from './src/harness.ts';
import { casesOf } from './implementations/index.ts';
import { loadKnownFailures } from './src/known.ts';
import { expandCases, loadCaseDefinitions } from './src/cases.ts';
import type { Harness } from './src/harness.ts';
import path from 'node:path';
import { Runner } from './src/runner.ts';
import { startServer, type RunningServer } from './src/server.ts';
import { clientSession, issue, SessionManager, type Session } from './src/session.ts';
import type { Target } from './implementations/index.ts';
import type { ConnectorResponse, Violation } from './src/types.ts';

const ids = (violations: Violation[]) => violations.map(v => v.id).sort();
const resolved = (result: unknown): ConnectorResponse => ({ kind: 'connector', result });
const rejected = (error: unknown): ConnectorResponse => ({ kind: 'connector-rejected', error });
const stream = tableToIPC(tableFromArrays({ x: [1] }), { format: 'stream' })!;
const file = tableToIPC(tableFromArrays({ x: [1] }), { format: 'file' })!;
const empty = tableToIPC(tableFromArrays({ x: [] }, { types: { x: int32() } }), { format: 'stream' })!;

describe('command-layer results', () => {
  it('accepts any ArrowIPCBytes form and any framing, but insists on a decodable table', () => {
    const rows = { arrow: { columns: ['x'], rows: [[1]] } };
    expect(checkResponse(rows, resolved(stream), 'inproc', {})).toEqual([]);
    expect(checkResponse(rows, resolved(stream.buffer.slice(stream.byteOffset, stream.byteOffset + stream.byteLength)), 'rest', {})).toEqual([]);
    expect(checkResponse(rows, resolved([stream.subarray(0, 40), stream.subarray(40)]), 'inproc', {})).toEqual([]);
    expect(checkResponse(rows, resolved(file), 'inproc', {})).toEqual([]);
    expect(ids(checkResponse(rows, resolved(new Uint8Array(0)), 'inproc', {}))).toEqual(['arrow.decode']);
    expect(ids(checkResponse(rows, resolved([]), 'inproc', {}))).toEqual(['arrow.decode']);
    expect(ids(checkResponse(rows, resolved({}), 'socket', {}))).toEqual(['arrow.not-bytes']);
    expect(ids(checkResponse(rows, rejected(new Error('boom')), 'inproc', {}))).toEqual(['arrow.rejected']);
    expect(ipcBytes('text')).toBeUndefined();
  });

  it('requires a zero-row result to decode with its schema', () => {
    expect(checkResponse({ arrow: { columns: ['x'], rowCount: 0 } }, resolved(empty), 'inproc', {})).toEqual([]);
    expect(ids(checkResponse({ arrow: { columns: ['y'], rowCount: 0 } }, resolved(empty), 'inproc', {}))).toEqual(['arrow.columns']);
  });

  it('checks exec and json results', () => {
    expect(checkResponse({ exec: true }, resolved(undefined), 'inproc', {})).toEqual([]);
    expect(ids(checkResponse({ exec: true }, resolved({ some: 'db' }), 'inproc', {}))).toEqual(['exec.result']);
    expect(ids(checkResponse({ exec: true }, rejected(new Error('no')), 'inproc', {}))).toEqual(['exec.rejected']);
    const preagg = { reference: { catalog: 'memory', schema: ['main'], table: 't' }, createdAt: '2026-09-25T10:00:00Z' };
    expect(checkResponse({ json: 'PreaggResponse' }, resolved(preagg), 'inproc', {})).toEqual([]);
    expect(ids(checkResponse({ json: 'PreaggResponse' }, resolved({ catalog: 'memory' }), 'inproc', {}))).toEqual(['json.schema.additional.catalog', 'json.schema.required.createdAt', 'json.schema.required.reference']);
    expect(ids(checkResponse({ json: 'PreaggResponse' }, resolved(stream), 'inproc', {}))).toEqual(['json.not-object']);
    const vars: Record<string, string> = {};
    expect(captureValues({ target: 'sqlname.reference' }, resolved(preagg), vars)).toEqual([]);
    expect(vars.target).toBe('"memory"."main"."t"');
  });

  it('reads errors off the rejection and never off its message', () => {
    const expectation = { error: { code: 'bad_request' as const, reason: 'sql_parse_error' as const } };
    const structured = Object.assign(new Error('Parser Error: near SELEC'), { code: 'bad_request', reason: 'sql_parse_error', status: 400 });
    expect(checkResponse(expectation, rejected(structured), 'rest', {})).toEqual([]);
    expect(ids(checkResponse(expectation, rejected(new Error('Query failed with HTTP status 500: Parser Error')), 'rest', {}))).toEqual(['error.code.missing', 'error.reason.missing', 'error.status.500']);
    expect(ids(checkResponse(expectation, rejected('Parser Error: near SELEC'), 'socket', {}))).toEqual(['error.code.missing', 'error.reason.missing']);
    expect(ids(checkResponse(expectation, rejected(Object.assign(new Error('x'), { code: 'internal_error', reason: 'execution_failed' })), 'rest', {}))).toEqual(['error.code.internal_error', 'error.reason.execution_failed']);
    expect(ids(checkResponse(expectation, resolved(stream), 'inproc', {}))).toEqual(['error.resolved']);
    expect(ids(checkResponse({ error: { code: 'bad_request', reason: 'missing_field', field: 'sql' } }, rejected(Object.assign(new Error('x'), { code: 'bad_request', reason: 'missing_field' })), 'rest', {}))).toEqual(['error.field.missing']);
  });

  it('requires a complete reference on table_not_found', () => {
    const expectation = { error: { code: 'table_not_found' as const } };
    const ok = Object.assign(new Error('gone'), { code: 'table_not_found', reference: { catalog: 'memory', schema: ['s'], table: 't' } });
    expect(checkResponse(expectation, rejected(ok), 'rest', {})).toEqual([]);
    expect(ids(checkResponse(expectation, rejected(Object.assign(new Error('gone'), { code: 'table_not_found' })), 'rest', {}))).toEqual(['error.reference.missing']);
    expect(ids(checkResponse(expectation, rejected(Object.assign(new Error('gone'), { code: 'table_not_found', reference: { catalog: 'memory', schema: 's', table: 't' } })), 'rest', {}))).toEqual(['error.reference.invalid']);
  });

  it('records a timeout as no reply, whatever was expected', () => {
    const timeout: ConnectorResponse = { kind: 'connector-timeout', after: 5 };
    expect(ids(checkResponse({ arrow: true }, timeout, 'inproc', {}))).toEqual(['connector.no-reply']);
    expect(ids(checkResponse({ error: { code: 'bad_request' } }, timeout, 'inproc', {}))).toEqual(['connector.no-reply']);
  });
});

describe('sessions', () => {
  const session = (behaviour: (request: Record<string, unknown>) => Promise<unknown>, isolated = true): Session & { disposed: number } => {
    const s = { disposed: 0, isolated, query: behaviour, dispose: async () => { s.disposed++; } };
    return s;
  };
  const after = (ms: number, value: unknown) => new Promise(resolve => setTimeout(() => resolve(value), ms));

  it('resolves, rejects, or times out without leaving a rejection unhandled', async () => {
    const s = session(async r => {
      if (r.sql === 'slow') return after(50, 1);
      if (r.sql === 'bad') throw new Error('bad');
      return 1;
    });
    expect(await issue(s, { sql: 'ok' })).toEqual({ kind: 'connector', result: 1 });
    expect(await issue(s, { sql: 'bad' })).toMatchObject({ kind: 'connector-rejected' });
    expect(await issue(s, { sql: 'slow' }, 10)).toEqual({ kind: 'connector-timeout', after: 10 });
    const late = session(() => after(10, undefined).then(() => { throw new Error('late'); }));
    expect(await issue(late, {}, 1)).toMatchObject({ kind: 'connector-timeout' });
    await after(30, undefined);
  });

  it('starts every pipelined deadline when the query is issued, not when it is awaited', async () => {
    const s = session(r => after(Number(r.sql), r.sql));
    const pending = [issue(s, { sql: '60' }, 100), issue(s, { sql: '5' }, 100), issue(s, { sql: '150' }, 100)];
    const results = await Promise.all(pending);
    expect(results.map(r => r.kind)).toEqual(['connector', 'connector', 'connector-timeout']);
  });

  it('replaces a tainted session only when disposing it isolates the implementation', async () => {
    const built: Array<Session & { disposed: number }> = [];
    const manager = new SessionManager(async () => { const s = session(async () => 1); built.push(s); return s; });
    const first = await manager.acquire();
    expect(await manager.acquire()).toBe(first);
    manager.taint();
    const second = await manager.acquire();
    expect(second).not.toBe(first);
    expect(built[0].disposed).toBe(1);
    await manager.dispose();
    expect(built[1].disposed).toBe(1);
    expect(built).toHaveLength(2);

    const shared = new SessionManager(async () => session(async () => 1, false));
    await shared.acquire();
    shared.taint();
    await expect(shared.acquire()).rejects.toThrow(/state is unknown.*aborting/);
    await expect(shared.acquire()).rejects.toThrow(/aborting/);
  });

  it('aborts when disposing a tainted session fails', async () => {
    const manager = new SessionManager(async () => ({ isolated: true, query: async () => 1, dispose: async () => { throw new Error('worker would not stop'); } }));
    await manager.acquire();
    manager.taint();
    await expect(manager.acquire()).rejects.toThrow(/could not dispose.*worker would not stop/);
    await expect(manager.acquire()).rejects.toThrow(/could not dispose/);
  });

  it('does not resume against a server whose delayed mutation is still in flight', async () => {
    const { createServer } = await import('node:http');
    let served = 0;
    const server = createServer((_, res) => { served++; setTimeout(() => { res.statusCode = 200; res.end(); }, 150); });
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
    const { port } = server.address() as { port: number };
    const manager = new SessionManager(async () => clientSession('rest', `http://127.0.0.1:${port}/`));
    try {
      const rest = await manager.acquire();
      expect(await issue(rest, { type: 'exec', sql: 'CREATE TABLE t AS SELECT 1' }, 40)).toMatchObject({ kind: 'connector-timeout' });
      manager.taint();
      await expect(manager.acquire()).rejects.toThrow(/aborting/);
      await new Promise(r => setTimeout(r, 200));
      expect(served).toBe(1);
    } finally {
      server.close();
    }
  });

  it('rethrows delivery failures from the real clients and keeps server errors as observations', async () => {
    const rest = clientSession('rest', 'http://127.0.0.1:1/');
    await expect(issue(rest, { type: 'arrow', sql: 'SELECT 1' })).rejects.toThrow(/could not deliver the request over rest/);
    const { createServer } = await import('node:net');
    const closed = createServer(socket => socket.destroy());
    await new Promise<void>(resolve => closed.listen(0, '127.0.0.1', resolve));
    const { port } = closed.address() as { port: number };
    try {
      const socket = clientSession('socket', `http://127.0.0.1:${port}/`);
      await expect(issue(socket, { type: 'arrow', sql: 'SELECT 1' })).rejects.toThrow(/WebSocket connection failed/);
    } finally {
      closed.close();
    }
    const engine = clientSession('rest', 'http://127.0.0.1:1/');
    engine.query = async () => { throw new Error('Parser Error: syntax error at or near "SELEC"'); };
    expect(await issue(engine, { type: 'arrow', sql: 'SELEC 1' })).toMatchObject({ kind: 'connector-rejected' });
    const reset = clientSession('rest', 'http://127.0.0.1:1/');
    reset.query = async () => { throw Object.assign(new TypeError('fetch failed'), { cause: Object.assign(new Error('read ECONNRESET'), { code: 'ECONNRESET' }) }); };
    expect(await issue(reset, { type: 'arrow', sql: 'SELECT 1' })).toMatchObject({ kind: 'connector-reset', reset: 'peer-closed' });
    const terminated = clientSession('rest', 'http://127.0.0.1:1/');
    terminated.query = async () => { throw Object.assign(new TypeError('terminated'), { cause: Object.assign(new Error('other side closed'), { code: 'UND_ERR_SOCKET' }) }); };
    expect(await issue(terminated, { type: 'arrow', sql: 'SELECT 1' })).toMatchObject({ kind: 'connector-reset', reset: 'body.socket-closed' });
    const dropped = clientSession('socket', 'http://127.0.0.1:1/');
    dropped.query = async () => { throw 'Socket closed'; };
    expect(await issue(dropped, { type: 'arrow', sql: 'SELECT 1' })).toMatchObject({ kind: 'connector-reset', reset: 'socket-closed' });
  });

  it('records a server that accepts the request and drops the connection as a reset, never as a missing envelope', async () => {
    const { createServer } = await import('node:net');
    const dropping = createServer(socket => socket.once('data', () => socket.destroy()));
    const truncating = createServer(socket => socket.once('data', () => {
      socket.write('HTTP/1.1 400 Bad Request\r\nContent-Type: application/json\r\nContent-Length: 200\r\n\r\n{"error":');
      setTimeout(() => socket.destroy(), 10);
    }));
    await Promise.all([dropping, truncating].map(s => new Promise<void>(resolve => s.listen(0, '127.0.0.1', resolve))));
    try {
      const expectation = { error: { code: 'bad_request' as const, reason: 'missing_field' as const, field: 'type' } };
      const drop = clientSession('rest', `http://127.0.0.1:${(dropping.address() as { port: number }).port}/`);
      const out = ids(checkResponse(expectation, await issue(drop, { sql: 'SELECT 1' }), 'rest', {}));
      expect(out).toHaveLength(1);
      expect(out[0]).toMatch(/^connector\.reset\.(peer-closed|socket-closed)$/);
      const trunc = clientSession('rest', `http://127.0.0.1:${(truncating.address() as { port: number }).port}/`);
      const cut = ids(checkResponse(expectation, await issue(trunc, { sql: 'SELECT 1' }), 'rest', {}));
      expect(cut).toEqual(['connector.reset.body.socket-closed']);
    } finally {
      dropping.close();
      truncating.close();
    }
  });
});

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
describe('skip notes', () => {
  it('round-trips the category and rejects free text', () => {
    expect(parseSkipNote(skipNote({ category: 'layer', reason: 'command transport, case is wire only' }))).toEqual({ category: 'layer', reason: 'command transport, case is wire only' });
    expect(parseSkipNote('requires policy')).toBeUndefined();
    expect(parseSkipNote(undefined)).toBeUndefined();
  });
});

describe('inheritance across transport sets', () => {
  it('drops inherited entries for cases the child never expands and validates the parent against its own cases', () => {
    const known = loadKnownFailures('go-cache', casesOf('go-cache'), casesOf);
    const inherited = known.inherited.flatMap(f => Object.keys(f.cases));
    expect(inherited).toContain('rest/sql-parse-error');
    expect(inherited).not.toContain('rest/missing-type');
    expect(inherited.every(id => casesOf('go-cache').has(id))).toBe(true);
    expect(() => loadKnownFailures('go-cache', casesOf('go-cache'))).toThrow(/go\.yaml.*references unknown case (rest|socket)\//);
  });
});

