import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryManager } from '../src/QueryManager.js';
import { RestConnector } from '../src/connectors/rest.js';

type FetchMock = ReturnType<typeof mockFetch>;

function mockFetch(response = () => new Response(new Uint8Array([1, 2, 3]))) {
  return vi.fn<typeof fetch>(async () => response());
}

function sentHeaders(fetchMock: FetchMock, call = 0) {
  return new Headers(fetchMock.mock.calls[call][1]!.headers);
}

const request = { type: 'arrow', sql: 'SELECT 1' } as const;

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
    const headers = { 'X-Api-Key': 'secret', 'Content-Type': 'text/plain' };
    await new RestConnector({ fetch: fetchMock, headers }).query(request);
    expect(sentHeaders(fetchMock).get('X-Api-Key')).toBe('secret');
    expect(sentHeaders(fetchMock).get('Content-Type')).toBe('application/json');
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

  it('does not retry exec queries', async () => {
    const fetchMock = fetchSteps(503);
    const connector = new RestConnector({ fetch: fetchMock, retries: 2 });
    await expect(connector.query({ type: 'exec', sql: 'CREATE TABLE t (x INT)' }))
      .rejects.toThrow('HTTP status 503');
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
