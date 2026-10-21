import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryManager } from '../src/QueryManager.js';
import { ConnectorError } from '../src/connectors/errors.js';
import { RestConnector } from '../src/connectors/rest.js';

type FetchMock = ReturnType<typeof mockFetch>;

function mockFetch(response = () => new Response(new Uint8Array([1, 2, 3]))) {
  return vi.fn<typeof fetch>(async () => response());
}

function sentHeaders(fetchMock: FetchMock, call = 0) {
  return new Headers(fetchMock.mock.calls[call][1]!.headers);
}

const request = { type: 'arrow', sql: 'SELECT 1' } as const;
const preagg = { type: 'preagg', sql: 'SELECT 1' } as const;

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

describe('RestConnector', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('posts the query as JSON', async () => {
    const fetchMock = mockFetch();
    const connector = new RestConnector({ uri: 'http://example.com/', fetch: fetchMock });

    const bytes = await connector.query(request);

    expect(new Uint8Array(bytes)).toEqual(new Uint8Array([1, 2, 3]));
    expect(fetchMock).toHaveBeenCalledOnce();
    const [uri, init] = fetchMock.mock.calls[0];
    expect(uri).toBe('http://example.com/');
    expect(init).toMatchObject({
      method: 'POST',
      mode: 'cors',
      credentials: 'omit',
      body: JSON.stringify(request)
    });
    expect(sentHeaders(fetchMock).get('Content-Type')).toBe('application/json');
  });

  it('calls a custom fetch without a receiver', async () => {
    const fetchMock = mockFetch();
    await new RestConnector({ fetch: fetchMock }).query(request);
    expect(fetchMock.mock.contexts[0]).toBeUndefined();
  });

  it('uses the global fetch when none is provided', async () => {
    const connector = new RestConnector();
    const fetchMock = mockFetch();
    vi.stubGlobal('fetch', fetchMock);

    await connector.query(request);

    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('sends custom headers with a JSON content type', async () => {
    const fetchMock = mockFetch();
    const headers = new Headers({ 'X-Api-Key': 'secret', 'Content-Type': 'text/plain' });
    await new RestConnector({ fetch: fetchMock, headers }).query(request);
    expect(sentHeaders(fetchMock).get('X-Api-Key')).toBe('secret');
    expect(sentHeaders(fetchMock).get('Content-Type')).toBe('application/json');
    expect(headers.get('Content-Type')).toBe('text/plain');
  });

  it('resolves a header function before each request', async () => {
    const fetchMock = mockFetch();
    let token = 0;
    const headers = vi.fn(async () => ({ Authorization: `Bearer ${++token}` }));
    const connector = new RestConnector({ fetch: fetchMock, headers });

    await connector.query(request);
    await connector.query({ type: 'exec', sql: 'CREATE TABLE t (x INT)' });

    expect(headers).toHaveBeenCalledTimes(2);
    expect(sentHeaders(fetchMock, 0).get('Authorization')).toBe('Bearer 1');
    expect(sentHeaders(fetchMock, 1).get('Authorization')).toBe('Bearer 2');
  });

  it('rejects with the HTTP status and response text', async () => {
    const fetchMock = mockFetch(() => new Response('bad sql', { status: 400 }));
    await expect(new RestConnector({ fetch: fetchMock }).query(request))
      .rejects.toThrow('Query failed with HTTP status 400: bad sql');
  });

  it('sends an Accept header only for preagg requests', async () => {
    const fetchMock = mockFetch(() => jsonResponse({}));
    const connector = new RestConnector({ fetch: fetchMock });

    await connector.query(preagg);
    expect(sentHeaders(fetchMock, 0).get('Accept')).toBe('application/json');

    await connector.query({ type: 'exec', sql: 'CREATE TABLE t AS SELECT 1' });
    expect(sentHeaders(fetchMock, 1).has('Accept')).toBe(false);

    await connector.query(request);
    expect(sentHeaders(fetchMock, 2).has('Accept')).toBe(false);
  });

  it('returns preagg JSON', async () => {
    const body = { reference: { catalog: 'memory', schema: ['s'], table: 't' }, createdAt: '2026-09-08T20:00:00Z' };
    const fetchMock = mockFetch(() => jsonResponse(body));
    expect(await new RestConnector({ fetch: fetchMock }).query(preagg)).toEqual(body);
    expect(fetchMock.mock.calls[0][1]!.body).toBe(JSON.stringify(preagg));
  });

  it('parses JSON error responses for arrow requests', async () => {
    const fetchMock = mockFetch(() => new Response(JSON.stringify({
      error: 'Materialized table is unavailable',
      code: 'table_not_found',
      reference: { catalog: 'memory', schema: ['mosaic_scope_a7'], table: 'preagg_c92f' }
    }), { status: 404, headers: { 'Content-Type': 'application/json; charset=utf-8' } }));

    const err = await new RestConnector({ fetch: fetchMock }).query(request).catch(e => e) as ConnectorError;
    expect(err).toBeInstanceOf(ConnectorError);
    expect(err).toMatchObject({
      message: 'Materialized table is unavailable',
      code: 'table_not_found',
      status: 404,
      reference: { catalog: 'memory', schema: ['mosaic_scope_a7'], table: 'preagg_c92f' }
    });
  });

  it.each([
    ['application/vnd.apache.arrow.stream', '{"error":"x","code":"forbidden"}'],
    ['application/json', 'not json']
  ] as const)('rejects failures without a code (%s): %s', async (contentType, body) => {
    const fetchMock = mockFetch(() => new Response(body, { status: 502, headers: { 'Content-Type': contentType } }));
    const err = await new RestConnector({ fetch: fetchMock }).query(preagg).catch(e => e) as ConnectorError;
    expect(err).toBeInstanceOf(ConnectorError);
    expect(err).toMatchObject({ status: 502, code: undefined, message: `Query failed with HTTP status 502: ${body}` });
  });
});

describe('RestConnector preagg error responses', () => {
  function failWith(status: number, contentType: string, body: string) {
    const fetchMock = mockFetch(() => new Response(body, { status, headers: { 'Content-Type': contentType } }));
    return new RestConnector({ fetch: fetchMock }).query(preagg).catch(e => e);
  }

  const relation = { catalog: 'c', schema: ['s'], table: 't' };

  it.each([
    ['empty object', {}, {}],
    ['non-string code', { error: 'x', code: 5 }, {}],
    ['non-object', 'nope', {}],
    ['message only', { error: 'x' }, { message: 'x', code: undefined }],
    ['partial reference', { error: 'x', code: 'table_not_found', reference: { catalog: 'c' } },
      { code: 'table_not_found', reference: undefined }],
    ['reference on other code', { error: 'x', code: 'forbidden', reference: relation },
      { code: 'forbidden', reference: undefined }]
  ])('error response: %s', async (_, response, expected) => {
    const body = JSON.stringify(response);
    const err = await failWith(500, 'application/json; charset=utf-8', body) as ConnectorError;
    expect(err).toBeInstanceOf(ConnectorError);
    expect(err.status).toBe(500);
    // a malformed error response falls back to the generic message
    expect(err).toMatchObject(Object.keys(expected).length
      ? expected
      : { message: `Query failed with HTTP status 500: ${body}`, code: undefined });
  });

  it('sends arrow queries as URL parameters with GET', async () => {
    const fetchMock = mockFetch();
    const headers = { 'X-Api-Key': 'secret', 'Content-Type': 'application/json' };
    const connector = new RestConnector({
      uri: 'http://example.com/', fetch: fetchMock, headers, method: 'GET'
    });

    await connector.query({ type: 'arrow', sql: 'SELECT 1 + 1' });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('http://example.com/?type=arrow&sql=SELECT+1+%2B+1');
    expect(init).toMatchObject({ method: 'GET', mode: 'cors', credentials: 'omit' });
    expect(init!.body).toBeUndefined();
    expect(sentHeaders(fetchMock).get('X-Api-Key')).toBe('secret');
    expect(sentHeaders(fetchMock).has('Content-Type')).toBe(false);
  });

  it('posts exec queries when using GET', async () => {
    const fetchMock = mockFetch();
    const exec = { type: 'exec', sql: 'CREATE TABLE t (x INT)' } as const;
    const connector = new RestConnector({ uri: 'http://example.com/', fetch: fetchMock, method: 'GET' });

    await connector.query(exec);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('http://example.com/');
    expect(init).toMatchObject({ method: 'POST', body: JSON.stringify(exec) });
    expect(sentHeaders(fetchMock).get('Content-Type')).toBe('application/json');
  });

  it('posts preagg queries when using GET', async () => {
    const fetchMock = mockFetch(() => jsonResponse({}));
    const connector = new RestConnector({ uri: 'http://example.com/', fetch: fetchMock, method: 'GET' });

    await connector.query(preagg);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('http://example.com/');
    expect(init).toMatchObject({ method: 'POST', body: JSON.stringify(preagg) });
    expect(sentHeaders(fetchMock).get('Content-Type')).toBe('application/json');
  });

  it('posts queries with other fields when using GET', async () => {
    const fetchMock = mockFetch();
    const query = { type: 'arrow', sql: 'SELECT 1', projectId: 123 } as const;
    await new RestConnector({ fetch: fetchMock, method: 'GET' }).query(query);
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: 'POST', body: JSON.stringify(query) });
  });

  it.each([
    ['/mosaic/', '/mosaic/?type=arrow&sql=SELECT+1'],
    ['http://example.com/?tenant=a', 'http://example.com/?tenant=a&type=arrow&sql=SELECT+1'],
    ['http://example.com/#view?x', 'http://example.com/?type=arrow&sql=SELECT+1#view?x'],
    ['http://example.com/?sql=SELECT+999&type=exec', 'http://example.com/?sql=SELECT+1&type=arrow']
  ])('adds GET parameters to %s', async (uri, expected) => {
    const fetchMock = mockFetch();
    await new RestConnector({ uri, fetch: fetchMock, method: 'GET' }).query(request);
    expect(fetchMock.mock.calls[0][0]).toBe(expected);
  });

  it('rejects an unknown method', () => {
    for (const method of ['get', 'PUT']) {
      // @ts-expect-error invalid method
      expect(() => new RestConnector({ method })).toThrow(RangeError);
    }
  });

  it('passes the abort signal to fetch', async () => {
    const fetchMock = mockFetch();
    const { signal } = new AbortController();
    await new RestConnector({ fetch: fetchMock }).query(request, { signal });
    expect(fetchMock.mock.calls[0][1]!.signal).toBe(signal);
  });

  it('stops waiting for headers when aborted', async () => {
    const fetchMock = mockFetch();
    const headers = () => new Promise<HeadersInit>(() => {});
    const controller = new AbortController();
    const reason = new Error('stop');
    const result = new RestConnector({ fetch: fetchMock, headers })
      .query(request, { signal: controller.signal });

    controller.abort(reason);

    await expect(result).rejects.toBe(reason);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('RestConnector retries', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'], now: 0 });
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  /** Respond with each step in turn: a thrown error, a status, or a response. */
  function fetchSteps(...steps: (Error | number | Response)[]) {
    let i = 0;
    return mockFetch(() => {
      const step = steps[i++];
      if (step instanceof Error) throw step;
      if (typeof step === 'number') return new Response(`status ${step}`, { status: step });
      return step ?? new Response(new Uint8Array([1, 2, 3]));
    });
  }

  function retryAfter(value: string, status = 503) {
    return new Response('busy', { status, headers: { 'Retry-After': value } });
  }

  it('rejects retries that are not a non-negative integer', () => {
    for (const retries of [-1, 1.5, NaN, Infinity]) {
      expect(() => new RestConnector({ retries })).toThrow(RangeError);
    }
  });

  it('does not retry by default', async () => {
    const fetchMock = fetchSteps(new TypeError('Failed to fetch'));
    await expect(new RestConnector({ fetch: fetchMock }).query(request))
      .rejects.toThrow('Failed to fetch');
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('retries network errors with exponential backoff', async () => {
    const fetchMock = fetchSteps(new TypeError('a'), new TypeError('b'), new TypeError('c'));
    const result = new RestConnector({ fetch: fetchMock, retries: 3 }).query(request);

    for (const [ms, calls] of [[124, 1], [1, 2], [249, 2], [1, 3], [499, 3], [1, 4]]) {
      await vi.advanceTimersByTimeAsync(ms);
      expect(fetchMock).toHaveBeenCalledTimes(calls);
    }
    expect(new Uint8Array(await result)).toEqual(new Uint8Array([1, 2, 3]));
  });

  it('fails once the retries are used up', async () => {
    const fetchMock = fetchSteps(new TypeError('a'), new TypeError('b'));
    const error = new RestConnector({ fetch: fetchMock, retries: 1 }).query(request).catch(err => err);

    await vi.advanceTimersByTimeAsync(125);

    expect(await error).toMatchObject({ message: 'b' });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it.each([502, 503])('retries HTTP %i', async status => {
    const fetchMock = fetchSteps(status);
    const result = new RestConnector({ fetch: fetchMock, retries: 1 }).query(request);

    await vi.advanceTimersByTimeAsync(125);

    expect(new Uint8Array(await result)).toEqual(new Uint8Array([1, 2, 3]));
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it.each([400, 429, 500, 504])('does not retry HTTP %i', async status => {
    const fetchMock = fetchSteps(status);
    await expect(new RestConnector({ fetch: fetchMock, retries: 2 }).query(request))
      .rejects.toThrow(`HTTP status ${status}`);
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('retries a result download that fails', async () => {
    const lost = {
      ok: true,
      status: 200,
      arrayBuffer: () => Promise.reject(new TypeError('terminated'))
    } as unknown as Response;
    const fetchMock = fetchSteps(lost);
    const result = new RestConnector({ fetch: fetchMock, retries: 1 }).query(request);

    await vi.advanceTimersByTimeAsync(125);

    expect(new Uint8Array(await result)).toEqual(new Uint8Array([1, 2, 3]));
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it.each([
    ['exec', (connector: RestConnector) => connector.query({ type: 'exec', sql: 'CREATE TABLE t (x INT)' })],
    ['preagg', (connector: RestConnector) => connector.query(preagg)]
  ] as const)('does not retry %s queries', async (_, query) => {
    const fetchMock = fetchSteps(503);
    await expect(query(new RestConnector({ fetch: fetchMock, retries: 2 }))).rejects.toThrow('HTTP status 503');
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it.each([
    ['seconds', '2', 2000],
    ['a date', new Date(3000).toUTCString(), 3000]
  ])('waits at least as long as a Retry-After in %s', async (_, value, wait) => {
    const fetchMock = fetchSteps(retryAfter(value));
    const result = new RestConnector({ fetch: fetchMock, retries: 1 }).query(request);

    await vi.advanceTimersByTimeAsync(wait - 1);
    expect(fetchMock).toHaveBeenCalledOnce();
    await vi.advanceTimersByTimeAsync(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    await result;
  });

  it('fails when Retry-After asks for more than five seconds', async () => {
    const fetchMock = fetchSteps(retryAfter('120'));
    await expect(new RestConnector({ fetch: fetchMock, retries: 2 }).query(request))
      .rejects.toThrow('Query failed with HTTP status 503: busy');
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it.each<[string, Error | number]>([
    ['a network error', new TypeError('Failed to fetch')],
    ['HTTP 503', 503]
  ])('stops waiting to retry %s when aborted', async (_, failure) => {
    const fetchMock = fetchSteps(failure);
    const controller = new AbortController();
    const reason = new Error('stop');
    const result = new RestConnector({ fetch: fetchMock, retries: 2 })
      .query(request, { signal: controller.signal });
    const rejected = expect(result).rejects.toBe(reason);

    await vi.advanceTimersByTimeAsync(50);
    controller.abort(reason);
    await rejected;
    await vi.advanceTimersByTimeAsync(1000);

    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('resolves headers before each attempt', async () => {
    const fetchMock = fetchSteps(503);
    let token = 0;
    const headers = () => ({ Authorization: `Bearer ${++token}` });
    const result = new RestConnector({ fetch: fetchMock, headers, retries: 1 }).query(request);

    await vi.advanceTimersByTimeAsync(125);
    await result;

    expect(sentHeaders(fetchMock, 0).get('Authorization')).toBe('Bearer 1');
    expect(sentHeaders(fetchMock, 1).get('Authorization')).toBe('Bearer 2');
  });

  it('does not extend the coordinator timeout when retrying', async () => {
    vi.mocked(Math.random).mockReturnValue(1);
    const fetchMock = fetchSteps(...Array.from({ length: 6 }, () => new TypeError('Failed to fetch')));
    const manager = new QueryManager();
    manager.connector(new RestConnector({ fetch: fetchMock, retries: 5 }));
    manager.timeout(300);
    const settled = vi.fn();
    const error = manager.request({ type: 'arrow', query: 'SELECT 1' })
      .then(settled, err => (settled(), err));

    await vi.advanceTimersByTimeAsync(299);
    expect(settled).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(2);

    await vi.advanceTimersByTimeAsync(1);
    expect(await error).toMatchObject({ name: 'TimeoutError' });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
