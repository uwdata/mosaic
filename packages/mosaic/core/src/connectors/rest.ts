import type {
  ArrowQueryRequest,
  Connector,
  ConnectorQueryOptions,
  ConnectorQueryRequest,
  ExecQueryRequest
} from './Connector.js';
import { abortable } from '../util/abort.js';

interface RestOptions {
  /** The URI for the DuckDB REST server. */
  uri?: string;
  /**
   * Request headers as a Headers object, a plain object, or name-value pairs,
   * or a function that returns them before each request.
   */
  headers?: HeadersInit | (() => HeadersInit | Promise<HeadersInit>);
  /** A fetch implementation to use instead of the global fetch. */
  fetch?: typeof fetch;
  /**
   * The HTTP method for arrow queries. GET sends the query as URL parameters
   * so that the result can be cached. Exec queries, and queries with fields
   * other than type and sql, use POST.
   */
  method?: 'GET' | 'POST';
}

/**
 * Connect to a DuckDB server over an HTTP REST interface.
 * @param options Connector options.
 * @param options.uri The URI for the DuckDB REST server.
 * @param options.headers Request headers as a Headers object, a plain object,
 *  or name-value pairs, or a function that returns them before each request.
 * @param options.fetch A fetch implementation to use instead of the global
 *  fetch.
 * @param options.method The HTTP method for arrow queries. GET sends the
 *  query as URL parameters so that the result can be cached. Exec queries,
 *  and queries with fields other than type and sql, use POST.
 * @returns A connector instance.
 */
export function restConnector(options?: RestOptions) {
  return new RestConnector(options);
}

export class RestConnector implements Connector {
  private _uri: string;
  private _headers: RestOptions['headers'];
  private _fetch: RestOptions['fetch'];
  private _method: NonNullable<RestOptions['method']>;

  constructor({
    uri = 'http://localhost:3000/',
    headers,
    fetch,
    method = 'POST'
  }: RestOptions = {}) {
    if (method !== 'GET' && method !== 'POST') {
      throw new RangeError(`Invalid method: ${method}`);
    }
    this._uri = uri;
    this._headers = headers;
    this._fetch = fetch;
    this._method = method;
  }

  async query(query: ArrowQueryRequest, options?: ConnectorQueryOptions): Promise<ArrayBuffer>;
  async query(query: ExecQueryRequest, options?: ConnectorQueryOptions): Promise<void>;
  async query(query: ConnectorQueryRequest, { signal }: ConnectorQueryOptions = {}): Promise<unknown> {
    const get = this._method === 'GET' && query.type === 'arrow'
      && Object.keys(query).every(key => key === 'type' || key === 'sql');
    signal?.throwIfAborted();
    const init = typeof this._headers === 'function' ? this._headers() : this._headers;
    const headers = new Headers(
      await (signal ? abortable(Promise.resolve(init), signal) : init)
    );
    signal?.throwIfAborted();
    if (get) {
      headers.delete('Content-Type');
    } else {
      headers.set('Content-Type', 'application/json');
    }

    // native fetch throws "Illegal invocation" when called as a method of another object
    const fetchImpl = this._fetch ?? fetch;
    const res = await fetchImpl(get ? queryURL(this._uri, query) : this._uri, {
      method: get ? 'GET' : 'POST',
      mode: 'cors',
      credentials: 'omit',
      headers,
      body: get ? undefined : JSON.stringify(query),
      signal
    });

    if (!res.ok) {
      throw new Error(`Query failed with HTTP status ${res.status}: ${await res.text()}`);
    }

    return query.type === 'exec' ? undefined : res.arrayBuffer();
  }
}

function queryURL(uri: string, { type, sql }: ConnectorQueryRequest): string {
  const end = uri.includes('#') ? uri.indexOf('#') : uri.length;
  const start = uri.indexOf('?');
  const search = start >= 0 && start < end;
  const params = new URLSearchParams(search ? uri.slice(start + 1, end) : '');
  params.set('type', type);
  params.set('sql', sql);
  return `${uri.slice(0, search ? start : end)}?${params}${uri.slice(end)}`;
}
