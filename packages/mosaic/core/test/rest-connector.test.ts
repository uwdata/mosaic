import { afterEach, describe, expect, it, vi } from 'vitest';
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
});
