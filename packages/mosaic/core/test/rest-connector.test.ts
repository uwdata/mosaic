import { afterEach, describe, expect, it, vi } from 'vitest';
import { RestConnector } from '../src/connectors/rest.js';
import { ConnectorError } from '../src/connectors/errors.js';

describe('RestConnector', () => {
  afterEach(() => vi.unstubAllGlobals());

  function stubFetch(response: Response) {
    const fetch = vi.fn(async () => response.clone());
    vi.stubGlobal('fetch', fetch);
    return fetch;
  }

  function lastInit(fetch: ReturnType<typeof vi.fn>): RequestInit {
    return (fetch.mock.calls.at(-1) as unknown[])[1] as RequestInit;
  }

  it('sends an Accept header only for preagg requests', async () => {
    const connector = new RestConnector({ uri: 'http://test/' });
    const fetch = stubFetch(new Response('{}', { headers: { 'Content-Type': 'application/json' } }));

    await connector.query({ type: 'preagg', sql: 'SELECT 1' });
    expect((lastInit(fetch).headers as Record<string, string>).Accept).toBe('application/json');

    await connector.query({ type: 'exec', sql: 'CREATE TABLE t AS SELECT 1' });
    expect((lastInit(fetch).headers as Record<string, string>).Accept).toBeUndefined();

    const arrowFetch = stubFetch(new Response(new ArrayBuffer(0)));
    await connector.query({ type: 'arrow', sql: 'SELECT 1' }).catch(() => {});
    expect((lastInit(arrowFetch).headers as Record<string, string>).Accept).toBeUndefined();
  });

  it('returns preagg JSON', async () => {
    const connector = new RestConnector({ uri: 'http://test/' });
    const body = { catalog: 'memory', schema: 's', table: 't', createdAt: '2026-09-08T20:00:00Z' };
    const fetch = stubFetch(new Response(JSON.stringify(body), {
      headers: { 'Content-Type': 'application/json' }
    }));
    expect(await connector.query({ type: 'preagg', sql: 'SELECT 1' })).toEqual(body);
    expect(lastInit(fetch).body).toBe(JSON.stringify({ type: 'preagg', sql: 'SELECT 1' }));
  });

  it.each([
    ['preagg', (connector: RestConnector) => connector.query({ type: 'preagg', sql: 'SELECT 1' })],
    ['arrow', (connector: RestConnector) => connector.query({ type: 'arrow', sql: 'SELECT 1' })],
    ['default', (connector: RestConnector) => connector.query({ sql: 'SELECT 1' })]
  ] as const)('parses JSON error responses for %s requests', async (_, query) => {
    const connector = new RestConnector({ uri: 'http://test/' });
    stubFetch(new Response(JSON.stringify({
      error: 'Materialized table is unavailable',
      code: 'table_not_found',
      catalog: 'memory', schema: 'mosaic_scope_a7', table: 'preagg_c92f'
    }), { status: 404, headers: { 'Content-Type': 'application/json; charset=utf-8' } }));

    const err = await query(connector).catch(e => e) as ConnectorError;
    expect(err).toBeInstanceOf(ConnectorError);
    expect(err).toMatchObject({
      message: 'Materialized table is unavailable',
      code: 'table_not_found',
      status: 404,
      catalog: 'memory', schema: 'mosaic_scope_a7', table: 'preagg_c92f'
    });
  });

  it.each([
    ['text/plain', 'missing table'],
    ['application/json', 'not json'],
    ['application/json', '{"code":"table_not_found"}']
  ])('rejects SELECT failures without a code for %s: %s', async (contentType, body) => {
    const connector = new RestConnector({ uri: 'http://test/' });
    stubFetch(new Response(body, { status: 404, headers: { 'Content-Type': contentType } }));
    const err = await connector.query({ type: 'arrow', sql: 'SELECT 1' }).catch(e => e) as ConnectorError;
    expect(err).toBeInstanceOf(ConnectorError);
    expect(err).toMatchObject({ status: 404, code: undefined, message: `Query failed with HTTP status 404: ${body}` });
  });
});

describe('RestConnector preagg error responses', () => {
  afterEach(() => vi.unstubAllGlobals());

  function failWith(status: number, contentType: string, body: string) {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(body, {
      status, headers: { 'Content-Type': contentType }
    })));
    return new RestConnector({ uri: 'http://test/' }).query({ type: 'preagg', sql: 'SELECT 1' }).catch(e => e);
  }

  const relation = { catalog: 'c', schema: 's', table: 't' };

  it.each([
    ['empty object', {}, {}],
    ['empty message', { error: '' }, {}],
    ['non-string code', { error: 'x', code: 5 }, {}],
    ['non-object', 'nope', {}],
    ['message only', { error: 'x' }, { message: 'x', code: undefined }],
    ['partial relation', { error: 'x', code: 'table_not_found', catalog: 'c' },
      { code: 'table_not_found', catalog: undefined }],
    ['full relation', { error: 'x', code: 'table_not_found', ...relation },
      { code: 'table_not_found', ...relation }],
    ['relation on other code', { error: 'x', code: 'forbidden', ...relation },
      { code: 'forbidden', catalog: undefined, schema: undefined, table: undefined }]
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

  it.each([
    ['text/html', '<h1>Bad Gateway</h1>'],
    ['text/html', ''],
    ['application/vnd.apache.arrow.stream', '{"error":"x","code":"forbidden"}'],
    ['application/json', 'not json']
  ])('non-JSON body (%s)', async (contentType, body) => {
    const err = await failWith(502, contentType, body) as ConnectorError;
    expect(err).toBeInstanceOf(ConnectorError);
    expect(err).toMatchObject({ status: 502, message: `Query failed with HTTP status 502: ${body}`, code: undefined });
  });
});
