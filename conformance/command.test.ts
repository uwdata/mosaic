import { int32, tableFromArrays, tableToIPC } from '@uwdata/flechette';
import { describe, expect, it } from 'vitest';
import { captureValues, checkResponse, ipcBytes } from './src/check.ts';
import { parseSkipNote, skipNote } from './src/harness.ts';
import { casesOf } from './implementations/index.ts';
import { loadKnownFailures } from './src/known.ts';
import { clientSession, issue, SessionManager, type Session } from './src/session.ts';
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
    expect(await issue(reset, { type: 'arrow', sql: 'SELECT 1' })).toMatchObject({ kind: 'connector-rejected' });
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
