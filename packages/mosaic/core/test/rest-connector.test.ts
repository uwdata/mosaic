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
});
