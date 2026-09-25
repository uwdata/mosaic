import { tableFromArrays, tableToIPC } from '@uwdata/flechette';
import { describe, expect, it } from 'vitest';
import { arrowViolations, walkStream } from './src/arrow.ts';
import { captureValues, checkResponse } from './src/check.ts';
import { compare } from './src/harness.ts';
import { classifyFetchError } from './src/http.ts';
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
  it('names the missing code rather than the whole schema', () => {
    const out = checkResponse({ error: { code: 'bad_request' } }, text('{"error":"missing required \'type\' parameter"}'), 'ws', {});
    expect(ids(out)).toEqual(['error.code.missing', 'error.schema.required.code']);
  });

  it('distinguishes a leaked table reference from a missing code', () => {
    const leak = text('{"error":"x","catalog":"a","schema":"b","table":"c"}');
    const out = checkResponse({ error: { code: 'bad_request' } }, leak, 'ws', {});
    expect(ids(out)).toEqual([
      'error.code.missing',
      'error.schema.forbidden.catalog',
      'error.schema.forbidden.schema',
      'error.schema.forbidden.table',
      'error.schema.required.code'
    ]);
  });

  it('carries the observed status and code in the id', () => {
    const out = checkResponse({ error: { code: 'bad_request' } }, http(500, '{"error":"boom","code":"internal_error"}', json), 'post', {});
    expect(ids(out)).toEqual(['error.code.internal_error', 'error.status.500']);
  });

  it('flags a success where a rejection was expected', () => {
    const out = checkResponse({ error: { code: 'bad_request' } }, http(200, '{"result":"accepted"}', json), 'post', {});
    expect(ids(out)).toEqual(['error.code.missing', 'error.schema.required.code', 'error.schema.required.error', 'error.status.200']);
  });

  it('accepts a conforming table_not_found envelope', () => {
    const body = '{"error":"gone","code":"table_not_found","catalog":"a","schema":"b","table":"c"}';
    expect(checkResponse({ error: { code: 'table_not_found' } }, http(404, body, json), 'post', {})).toEqual([]);
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
    expect(ids(checkResponse({ arrow: true }, { kind: 'http-failed', reset: 'econnreset', error: 'x' }, 'get', {}))).toEqual(['http.reset.econnreset']);
  });
});

describe('fetch error classification', () => {
  const failure = (code?: string, message = code ?? '') => Object.assign(new TypeError('fetch failed'), { cause: Object.assign(new Error(message), code ? { code } : {}) });

  it('baselines only a reset after the request was sent', () => {
    expect(classifyFetchError(failure('ECONNRESET', 'write ECONNRESET'))).toMatchObject({ reset: 'econnreset' });
    expect(classifyFetchError(failure('UND_ERR_SOCKET', 'other side closed'))).toMatchObject({ reset: 'socket-closed' });
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
    const expected = new Set(['http.reset.econnreset|arrow.status.505']);
    expect(compare([{ id: 'arrow.status.505', detail: '' }], expected)).toMatchObject({ regressions: [], resolved: [] });
    expect(compare([{ id: 'http.reset.econnreset', detail: '' }], expected)).toMatchObject({ regressions: [], resolved: [] });
    expect(compare([], expected).resolved).toEqual(['http.reset.econnreset|arrow.status.505']);
    expect(compare([{ id: 'arrow.status.200', detail: '' }], expected).regressions.map(v => v.id)).toEqual(['arrow.status.200']);
  });
});
