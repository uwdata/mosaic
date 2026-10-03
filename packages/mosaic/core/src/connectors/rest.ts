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
  /** Request headers, or a function that returns them before each request. */
  headers?: HeadersInit | (() => HeadersInit | Promise<HeadersInit>);
  /** A fetch implementation to use instead of the global fetch. */
  fetch?: typeof fetch;
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
 * @param options.headers Request headers, or a function that returns them
 *  before each request.
 * @param options.fetch A fetch implementation to use instead of the global
 *  fetch.
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
  private _retries: number;

  constructor({
    uri = 'http://localhost:3000/',
    headers,
    fetch,
    retries = 0
  }: RestOptions = {}) {
    if (!Number.isInteger(retries) || retries < 0) {
      throw new RangeError(`Invalid retries value: ${retries}`);
    }
    this._uri = uri;
    this._headers = headers;
    this._fetch = fetch;
    this._retries = retries;
  }

  async query(query: ArrowQueryRequest, options?: ConnectorQueryOptions): Promise<ArrayBuffer>;
  async query(query: ExecQueryRequest, options?: ConnectorQueryOptions): Promise<void>;
  async query(query: ConnectorQueryRequest, { signal }: ConnectorQueryOptions = {}): Promise<unknown> {
    const retries = query.type === 'arrow' ? this._retries : 0;
    const body = JSON.stringify(query);

    for (let attempt = 0; ; ++attempt) {
      signal?.throwIfAborted();
      const init = typeof this._headers === 'function' ? this._headers() : this._headers;
      const headers = new Headers(
        await (signal ? abortable(Promise.resolve(init), signal) : init)
      );
      signal?.throwIfAborted();
      headers.set('Content-Type', 'application/json');

      // native fetch throws "Illegal invocation" when called as a method of another object
      const fetchImpl = this._fetch ?? fetch;
      let res: Response;
      try {
        res = await fetchImpl(this._uri, {
          method: 'POST',
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

function backoff(attempt: number): number {
  return Math.random() * Math.min(RETRY_MAX_DELAY, RETRY_BASE_DELAY * 2 ** attempt);
}

function retryAfter(res: Response): number {
  const value = res.headers.get('Retry-After')?.trim();
  if (!value) return 0;
  const ms = /^\d+$/.test(value) ? Number(value) * 1000 : Date.parse(value) - Date.now();
  return Number.isNaN(ms) ? 0 : Math.max(0, ms);
}
