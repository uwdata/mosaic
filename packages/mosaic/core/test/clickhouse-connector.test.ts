import { describe, expect, it, vi } from 'vitest';
import { ClickHouseConnector } from '../src/connectors/clickhouse.js';

type FetchMock = ReturnType<typeof mockFetch>;

function mockFetch(response = () => new Response(new Uint8Array([1, 2, 3]))) {
  return vi.fn<typeof fetch>(async () => response());
}

function sentURL(fetchMock: FetchMock, call = 0) {
  return new URL(String(fetchMock.mock.calls[call][0]));
}

function sentHeaders(fetchMock: FetchMock, call = 0) {
  return new Headers(fetchMock.mock.calls[call][1]!.headers);
}

const request = { type: 'arrow', sql: 'SELECT 1' } as const;

describe('ClickHouseConnector', () => {
  it('posts arrow queries as raw SQL in ArrowStream format', async () => {
    const fetchMock = mockFetch();
    const connector = new ClickHouseConnector({ uri: 'http://example.com/', fetch: fetchMock });

    const bytes = await connector.query(request);

    expect(new Uint8Array(bytes)).toEqual(new Uint8Array([1, 2, 3]));
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: 'POST', body: 'SELECT 1' });
    const url = sentURL(fetchMock);
    expect(url.origin + url.pathname).toBe('http://example.com/');
    expect(Object.fromEntries(url.searchParams)).toEqual({
      wait_end_of_query: '1',
      output_format_arrow_compression_method: 'none',
      default_format: 'ArrowStream'
    });
  });

  it('runs exec queries without an output format', async () => {
    const fetchMock = mockFetch(() => new Response('Ok.'));
    const result = await new ClickHouseConnector({ fetch: fetchMock })
      .query({ type: 'exec', sql: 'CREATE TABLE t (x Int32) ENGINE = Memory' });
    expect(result).toBeUndefined();
    expect(sentURL(fetchMock).searchParams.has('default_format')).toBe(false);
  });

  it('sends the database, settings, and credentials', async () => {
    const fetchMock = mockFetch();
    const connector = new ClickHouseConnector({
      uri: 'http://example.com/?extremes=0',
      database: 'demo',
      user: 'reader',
      password: 'secret',
      headers: { 'X-Trace': 'abc' },
      settings: { max_threads: 4, output_format_arrow_compression_method: 'lz4_frame' },
      fetch: fetchMock
    });

    await connector.query(request);

    const params = sentURL(fetchMock).searchParams;
    expect(params.get('extremes')).toBe('0');
    expect(params.get('database')).toBe('demo');
    expect(params.get('max_threads')).toBe('4');
    expect(params.get('output_format_arrow_compression_method')).toBe('lz4_frame');
    const headers = sentHeaders(fetchMock);
    expect(headers.get('X-ClickHouse-User')).toBe('reader');
    expect(headers.get('X-ClickHouse-Key')).toBe('secret');
    expect(headers.get('X-Trace')).toBe('abc');
  });

  it('keeps relative URIs relative', async () => {
    const fetchMock = mockFetch();
    await new ClickHouseConnector({ uri: '/clickhouse/', database: 'demo', fetch: fetchMock }).query(request);
    expect(String(fetchMock.mock.calls[0][0])).toMatch(/^\/clickhouse\/\?.*database=demo/);
  });

  it('passes the abort signal to fetch', async () => {
    const fetchMock = mockFetch();
    const { signal } = new AbortController();
    await new ClickHouseConnector({ fetch: fetchMock }).query(request, { signal });
    expect(fetchMock.mock.calls[0][1]!.signal).toBe(signal);
  });

  it('reports ClickHouse errors', async () => {
    const fetchMock = mockFetch(() => new Response('Code: 62. DB::Exception: Syntax error', { status: 400 }));
    await expect(new ClickHouseConnector({ fetch: fetchMock }).query(request))
      .rejects.toThrow('ClickHouse query failed with HTTP status 400: Code: 62. DB::Exception: Syntax error');
  });
});
