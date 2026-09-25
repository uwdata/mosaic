import { tableFromArrays, tableToIPC } from '@uwdata/flechette';
import { describe, expect, it } from 'vitest';
import { arrowViolations, walkStream } from './src/arrow.ts';
import { captureValues, checkResponse, sqlName } from './src/check.ts';
import { compare } from './src/harness.ts';
import { classifyFetchError, sendHttp } from './src/http.ts';
import type { HttpResponse, Violation, WsResponse } from './src/types.ts';

const ids = (violations: Violation[]) => violations.map(v => v.id).sort();

function http(status: number, body: string | Uint8Array, headers: Record<string, string> = {}): HttpResponse {
  return {
    kind: 'http',
    status,
    headers: new Headers(headers),
    body: typeof body === 'string' ? new TextEncoder().encode(body) : body
  };
}

function text(frame: string): WsResponse {
  return { kind: 'ws', frame: 'text', text: frame };
}

const json = { 'content-type': 'application/json' };
const stream = tableToIPC(tableFromArrays({ x: [1] }), { format: 'stream' })!;
const file = tableToIPC(tableFromArrays({ x: [1] }), { format: 'file' })!;

describe('error envelope violations', () => {
  const missingType = { error: 'missing type', code: 'bad_request', reason: 'missing_field', field: 'type' };

  it('names the missing code and reason rather than the whole schema', () => {
    const out = checkResponse({ error: { code: 'bad_request', reason: 'missing_field', field: 'type' } }, text('{"error":"missing required \'type\' parameter"}'), 'ws', {});
    expect(ids(out)).toEqual(['error.code.missing', 'error.field.missing', 'error.reason.missing', 'error.schema.required.code', 'error.schema.required.reason']);
  });

  it('accepts a conforming envelope regardless of message wording', () => {
    expect(checkResponse({ error: { code: 'bad_request', reason: 'missing_field', field: 'type' } }, text(JSON.stringify(missingType)), 'ws', {})).toEqual([]);
    expect(checkResponse({ error: { code: 'bad_request', reason: 'missing_field', field: 'type' } }, text(JSON.stringify({ ...missingType, error: 'Object missing required field `type`' })), 'ws', {})).toEqual([]);
  });

  it('carries the observed reason and field in the id', () => {
    const wrong = { ...missingType, reason: 'invalid_field', field: 'sql' };
    const out = checkResponse({ error: { code: 'bad_request', reason: 'missing_field', field: 'type' } }, text(JSON.stringify(wrong)), 'ws', {});
    expect(ids(out)).toEqual(['error.field.sql', 'error.reason.invalid_field']);
  });

  it('only checks reason and field when the case names them', () => {
    const out = checkResponse({ error: { code: 'bad_request' } }, text('{"error":"x","code":"bad_request","reason":"sql_parse_error"}'), 'ws', {});
    expect(out).toEqual([]);
  });

  it('distinguishes a leaked table reference from a missing code', () => {
    const leak = text('{"error":"x","reason":"execution_failed","reference":{"catalog":"a","schema":["b"],"table":"c"}}');
    const out = checkResponse({ error: { code: 'bad_request' } }, leak, 'ws', {});
    expect(ids(out)).toEqual(['error.code.missing', 'error.schema.forbidden.reference', 'error.schema.required.code']);
    const flat = text('{"error":"x","code":"internal_error","reason":"execution_failed","catalog":"a","schema":"b","table":"c"}');
    expect(ids(checkResponse({ error: { code: 'internal_error' } }, flat, 'ws', {}))).toEqual(['error.schema.forbidden.catalog', 'error.schema.forbidden.schema', 'error.schema.forbidden.table']);
  });

  it('carries the observed status and code in the id', () => {
    const out = checkResponse({ error: { code: 'bad_request' } }, http(500, '{"error":"boom","code":"internal_error","reason":"internal_failure"}', json), 'post', {});
    expect(ids(out)).toEqual(['error.code.internal_error', 'error.status.500']);
  });

  it('flags a success where a rejection was expected', () => {
    const out = checkResponse({ error: { code: 'bad_request' } }, http(200, '{"result":"accepted"}', json), 'post', {});
    expect(ids(out)).toEqual(['error.code.missing', 'error.schema.required.code', 'error.schema.required.error', 'error.schema.required.reason', 'error.status.200']);
  });

  it('accepts a conforming table_not_found envelope', () => {
    const body = '{"error":"gone","code":"table_not_found","reason":"materialization_missing","reference":{"catalog":"a","schema":["b"],"table":"c"}}';
    expect(checkResponse({ error: { code: 'table_not_found' } }, http(404, body, json), 'post', {})).toEqual([]);
  });

  it('rejects reversed diagnostic spans and offsets past the submitted SQL', () => {
    const parse = (location: Record<string, number>) => http(400, JSON.stringify({ error: 'bad', code: 'bad_request', reason: 'sql_parse_error', diagnostics: [{ message: 'near' }, { message: 'span', location }] }), json);
    const expectation = { error: { code: 'bad_request' as const, reason: 'sql_parse_error' as const } };
    expect(checkResponse(expectation, parse({ start: 2, end: 6 }), 'post', {})).toEqual([]);
    expect(checkResponse(expectation, parse({ start: 2, end: 6 }), 'post', {}, 'SELEC 1')).toEqual([]);
    expect(checkResponse(expectation, parse({ start: 7 }), 'post', {}, 'SELEC 1')).toEqual([]);
    expect(ids(checkResponse(expectation, parse({ start: 20, end: 2 }), 'post', {}))).toEqual(['error.diagnostics.1.location.reversed']);
    expect(ids(checkResponse(expectation, parse({ start: 0, end: 8 }), 'post', {}, 'SELEC 1'))).toEqual(['error.diagnostics.1.location.out-of-range']);
    expect(ids(checkResponse(expectation, parse({ start: 8 }), 'post', {}, 'SELEC 1'))).toEqual(['error.diagnostics.1.location.out-of-range']);
    expect(checkResponse(expectation, parse({ start: 0, end: 11 }), 'post', {}, "SELECT 'é'")).toEqual([]);
    expect(ids(checkResponse(expectation, parse({ start: 0, end: 12 }), 'post', {}, "SELECT 'é'"))).toEqual(['error.diagnostics.1.location.out-of-range']);
  });

  it('checks X-Request-Id and Retry-After against the envelope only when both are present', () => {
    const exhausted = { error: 'busy', code: 'resource_exhausted', reason: 'resource_limit_exceeded', retryAfterMs: 1500, diagnosticId: 'req_1' };
    const expectation = { error: { code: 'resource_exhausted' as const } };
    expect(checkResponse(expectation, http(429, JSON.stringify(exhausted), json), 'post', {})).toEqual([]);
    expect(checkResponse(expectation, http(429, JSON.stringify(exhausted), { ...json, 'retry-after': '2', 'x-request-id': 'req_1' }), 'post', {})).toEqual([]);
    const out = checkResponse(expectation, http(429, JSON.stringify(exhausted), { ...json, 'retry-after': '1', 'x-request-id': 'req_2' }), 'post', {});
    expect(ids(out)).toEqual(['error.diagnostic-id.mismatch', 'error.retry-after.mismatch']);
  });
});

describe('arrow violations', () => {
  it('accepts a complete stream and compares rows', () => {
    expect(ids(arrowViolations(stream, { columns: ['x'], rows: [[1]] }))).toEqual([]);
    expect(ids(arrowViolations(stream, { columns: ['x'], rows: [[2]] }))).toEqual(['arrow.rows']);
  });

  it('requires the end-of-stream marker even when decoding succeeds', () => {
    const truncated = stream.subarray(0, stream.length - 8);
    expect(walkStream(stream)).toMatchObject({ eos: true, messages: 2 });
    expect(walkStream(truncated).eos).toBe(false);
    expect(walkStream(truncated).problem).toBeUndefined();
    expect(ids(arrowViolations(truncated, { columns: ['x'], rows: [[1]] }))).toEqual(['arrow.eos']);
  });

  it('records the file format and still compares rows', () => {
    expect(ids(arrowViolations(file, { rows: [[1]] }))).toEqual(['arrow.file-format']);
    expect(ids(arrowViolations(file, { rows: [[2]] }))).toEqual(['arrow.file-format', 'arrow.rows']);
  });

  it('reports a non-200 as the status alone', () => {
    const out = checkResponse({ arrow: true }, http(431, '', { 'content-type': 'text/plain' }), 'get', {});
    expect(ids(out)).toEqual(['arrow.status.431']);
  });

  it('flags an empty body on a 200', () => {
    const out = checkResponse({ arrow: true }, http(200, '', { 'content-type': 'application/vnd.apache.arrow.stream' }), 'post', {});
    expect(ids(out)).toEqual(['arrow.empty']);
  });
});

describe('header matchers', () => {
  const headers = {
    'access-control-allow-origin': 'http://example.test',
    'access-control-allow-methods': 'GET, POST',
    'access-control-allow-headers': '*',
    etag: '"abc"'
  };
  const response = http(204, '', headers);

  it('checks origin values, method tokens, and wildcard header lists', () => {
    const out = checkResponse({
      headers: {
        'access-control-allow-origin': { anyOf: ['*', 'http://example.test'] },
        'access-control-allow-methods': { tokens: ['POST'] },
        'access-control-allow-headers': { tokens: ['content-type'] }
      }
    }, response, 'post', {});
    expect(out).toEqual([]);
    const wrong = checkResponse({
      headers: {
        'access-control-allow-origin': { anyOf: ['*', 'http://other.test'] },
        'access-control-allow-methods': { tokens: ['DELETE'] }
      }
    }, response, 'post', {});
    expect(ids(wrong)).toEqual(['header.access-control-allow-methods', 'header.access-control-allow-origin']);
  });

  it('supports captured values, negation, absence, and empty-or-absent', () => {
    const vars = { etag: '"abc"', vary: '' };
    expect(checkResponse({ headers: { etag: '{{etag}}', vary: '{{vary}}', 'cache-control': { absent: true } } }, response, 'get', vars)).toEqual([]);
    expect(ids(checkResponse({ headers: { etag: { not: '{{etag}}' } } }, response, 'get', vars))).toEqual(['header.etag']);
  });

  it('turns a failed capture into a violation instead of throwing', () => {
    const vars: Record<string, string> = {};
    expect(ids(captureValues({ tag: 'headers.x-missing', vary: 'headers.vary?' }, response, vars))).toEqual(['capture.tag']);
    expect(vars).toEqual({ vary: '' });
  });
});

describe('table reference capture', () => {
  const reference = { catalog: 'mem.ory', schema: ['mosaic', 'sco"pe'], table: 'preagg_c92f' };
  const body = JSON.stringify({ reference, createdAt: '2026-09-25T10:00:00Z', rows: 10 });

  it('quotes every component separately, keeping dots and doubling quotes', () => {
    expect(sqlName(reference)).toBe('"mem.ory"."mosaic"."sco""pe"."preagg_c92f"');
    expect(sqlName({ catalog: 'memory', schema: ['main'], table: 't' })).toBe('"memory"."main"."t"');
  });

  it('rejects flat, empty, or partial references', () => {
    expect(sqlName({ catalog: 'a', schema: 'b', table: 'c' })).toBeUndefined();
    expect(sqlName({ catalog: 'a', schema: [], table: 'c' })).toBeUndefined();
    expect(sqlName({ catalog: 'a', schema: ['', 'b'], table: 'c' })).toBeUndefined();
    expect(sqlName({ catalog: 'a', schema: ['b'] })).toBeUndefined();
    expect(sqlName('a.b.c')).toBeUndefined();
  });

  it('captures nested body paths and rendered SQL names', () => {
    const vars: Record<string, string> = {};
    const out = captureValues({ target: 'sqlname.reference', catalog: 'body.reference.catalog', rows: 'body.rows', missing: 'sqlname.nothing' }, http(200, body, json), vars);
    expect(ids(out)).toEqual(['capture.missing']);
    expect(vars).toEqual({ target: '"mem.ory"."mosaic"."sco""pe"."preagg_c92f"', catalog: 'mem.ory', rows: '10' });
    const flat = http(200, JSON.stringify({ catalog: 'a', schema: 'b', table: 'c' }), json);
    expect(ids(captureValues({ target: 'sqlname.reference' }, flat, {}))).toEqual(['capture.target']);
  });
});

describe('alternatives and connection outcomes', () => {
  it('prefixes the closest alternative when none matches', () => {
    const out = checkResponse(
      { oneOf: [{ arrow: true }, { error: { status: 415, code: 'bad_request' } }] },
      http(415, 'Unsupported', { 'content-type': 'text/plain' }),
      'post',
      {}
    );
    expect(ids(out)).toEqual(['alt1.error.content-type', 'alt1.error.not-json']);
  });

  it('records close codes and silence', () => {
    expect(ids(checkResponse({ arrow: true }, { kind: 'ws', frame: 'close', closeCode: 1007 }, 'ws', {}))).toEqual(['ws.closed.1007']);
    expect(ids(checkResponse({ arrow: true }, { kind: 'ws', frame: 'timeout' }, 'ws', {}))).toEqual(['ws.no-reply']);
    expect(ids(checkResponse({ arrow: true }, { kind: 'http-failed', reset: 'peer-closed', error: 'x' }, 'get', {}))).toEqual(['http.reset.peer-closed']);
  });
});

describe('fetch error classification', () => {
  const failure = (code?: string, message = code ?? '') => Object.assign(new TypeError('fetch failed'), { cause: Object.assign(new Error(message), code ? { code } : {}) });

  it('baselines only a reset after the request was sent', () => {
    expect(classifyFetchError(failure('ECONNRESET', 'write ECONNRESET'))).toMatchObject({ reset: 'peer-closed' });
    expect(classifyFetchError(failure('EPIPE', 'write EPIPE'))).toMatchObject({ reset: 'peer-closed' });
    expect(classifyFetchError(failure('UND_ERR_SOCKET', 'other side closed'))).toMatchObject({ reset: 'socket-closed' });
  });

  it('keeps the received status when the close lands during the body', async () => {
    const { createServer } = await import('node:net');
    const truncated = async (status: string) => {
      const server = createServer(socket => {
        socket.write(`HTTP/1.1 ${status}\r\nContent-Length: 10\r\n\r\nab`);
        setTimeout(() => socket.destroy(), 10);
      });
      await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
      const { port } = server.address() as { port: number };
      try {
        return await sendHttp(`http://127.0.0.1:${port}/`, 'get', { request: { type: 'arrow', sql: 'SELECT 1' }, expect: {} }, {});
      } finally {
        server.close();
      }
    };
    const rejected = await truncated('505 HTTP Version Not Supported');
    expect(rejected).toMatchObject({ kind: 'http-failed', reset: 'socket-closed', status: 505 });
    expect(ids(checkResponse({ arrow: true }, rejected, 'get', {}))).toEqual(['http.reset.after-505.socket-closed']);
    const accepted = await truncated('200 OK');
    expect(ids(checkResponse({ arrow: true }, accepted, 'get', {}))).toEqual(['http.reset.after-200.socket-closed']);
  });

  it('does not let a truncated 200 satisfy a baselined 505 rejection', () => {
    const baseline = new Set(['http.reset.peer-closed|arrow.status.505|http.reset.after-505.socket-closed']);
    expect(compare([{ id: 'http.reset.after-505.socket-closed', detail: '' }], baseline)).toMatchObject({ regressions: [], resolved: [] });
    const verdict = compare([{ id: 'http.reset.after-200.socket-closed', detail: '' }], baseline);
    expect(ids(verdict.regressions)).toEqual(['http.reset.after-200.socket-closed']);
    expect(verdict.resolved).toEqual([...baseline]);
  });

  it('leaves refusals, bad ports, DNS failures, and timeouts fatal', () => {
    expect(classifyFetchError(failure('ECONNREFUSED'))).toBeUndefined();
    expect(classifyFetchError(failure(undefined, 'bad port'))).toBeUndefined();
    expect(classifyFetchError(failure('ENOTFOUND'))).toBeUndefined();
    expect(classifyFetchError(Object.assign(new Error('aborted'), { name: 'TimeoutError' }))).toBeUndefined();
  });
});

describe('ratchet comparison', () => {
  const observed: Violation[] = [{ id: 'error.not-json', detail: '' }, { id: 'error.status.200', detail: '' }];

  it('separates known, new, and vanished violations', () => {
    const verdict = compare(observed, new Set(['error.not-json', 'error.content-type']));
    expect(ids(verdict.known)).toEqual(['error.not-json']);
    expect(ids(verdict.regressions)).toEqual(['error.status.200']);
    expect(verdict.resolved).toEqual(['error.content-type']);
  });

  it('is clean when observed equals the baseline', () => {
    const verdict = compare(observed, new Set(observed.map(v => v.id)));
    expect(verdict.regressions).toEqual([]);
    expect(verdict.resolved).toEqual([]);
  });
});

describe('ratchet alternatives', () => {
  it('accepts exactly one member of an a|b entry', () => {
    const expected = new Set(['http.reset.peer-closed|arrow.status.505']);
    expect(compare([{ id: 'arrow.status.505', detail: '' }], expected)).toMatchObject({ regressions: [], resolved: [] });
    expect(compare([{ id: 'http.reset.peer-closed', detail: '' }], expected)).toMatchObject({ regressions: [], resolved: [] });
    expect(compare([], expected).resolved).toEqual(['http.reset.peer-closed|arrow.status.505']);
    expect(compare([{ id: 'arrow.status.200', detail: '' }], expected).regressions.map(v => v.id)).toEqual(['arrow.status.200']);
  });
});
