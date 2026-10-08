import type {
  ArrowQueryRequest,
  Connector,
  ConnectorQueryOptions,
  ConnectorQueryRequest,
  ExecQueryRequest
} from './Connector.js';
import { abortable, sleep } from '../util/abort.js';

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
  /**
   * The number of times to retry an arrow query after a network error or an
   * HTTP 502 or 503 response. A retried query may run more than once.
   */
  retries?: number;
}

const RETRY_STATUS = new Set([502, 503]);
const RETRY_BASE_DELAY = 250;
const RETRY_MAX_DELAY = 5000;

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
 * @param options.retries The number of times to retry an arrow query after a
 *  network error or an HTTP 502 or 503 response. A retried query may run
 *  more than once.
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
  private _retries: number;

  constructor({
    uri = 'http://localhost:3000/',
    headers,
    fetch,
    method = 'POST',
    retries = 0
  }: RestOptions = {}) {
    if (method !== 'GET' && method !== 'POST') {
      throw new RangeError(`Invalid method: ${method}`);
    }
    if (!Number.isInteger(retries) || retries < 0) {
      throw new RangeError(`Invalid retries value: ${retries}`);
    }
    this._uri = uri;
    this._headers = headers;
    this._fetch = fetch;
    this._method = method;
    this._retries = retries;
  }

  async query(query: ArrowQueryRequest, options?: ConnectorQueryOptions): Promise<ArrayBuffer>;
  async query(query: ExecQueryRequest, options?: ConnectorQueryOptions): Promise<void>;
  async query(query: ConnectorQueryRequest, { signal }: ConnectorQueryOptions = {}): Promise<unknown> {
    const get = this._method === 'GET' && query.type === 'arrow'
      && Object.keys(query).every(key => key === 'type' || key === 'sql');
    const retries = query.type === 'arrow' ? this._retries : 0;
    const url = get ? queryURL(this._uri, query) : this._uri;
    const body = get ? undefined : JSON.stringify(query);

    for (let attempt = 0; ; ++attempt) {
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
      let res: Response;
      try {
        res = await fetchImpl(url, {
          method: get ? 'GET' : 'POST',
          mode: 'cors',
          credentials: 'omit',
          headers,
          body,
          signal
        });
        if (res.ok) {
          return query.type === 'exec' ? undefined : await res.arrayBuffer();
        }
      } catch (err) {
        if (attempt < retries && err instanceof TypeError) {
          await sleep(backoff(attempt), signal);
          continue;
        }
        throw err;
      }

      if (attempt < retries && RETRY_STATUS.has(res.status)) {
        const delay = Math.max(retryAfter(res), backoff(attempt));
        if (delay <= RETRY_MAX_DELAY) {
          res.body?.cancel().catch(() => {});
          await sleep(delay, signal);
          continue;
        }
      }

      throw new Error(`Query failed with HTTP status ${res.status}: ${await res.text()}`);
    }
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

function backoff(attempt: number): number {
  return Math.random() * Math.min(RETRY_MAX_DELAY, RETRY_BASE_DELAY * 2 ** attempt);
}

function retryAfter(res: Response): number {
  const value = res.headers.get('Retry-After')?.trim();
  if (!value) return 0;
  const ms = /^\d+$/.test(value) ? Number(value) * 1000 : Date.parse(value) - Date.now();
  return Number.isNaN(ms) ? 0 : Math.max(0, ms);
}
