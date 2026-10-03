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
  /** Request headers, or a function that returns them before each request. */
  headers?: HeadersInit | (() => HeadersInit | Promise<HeadersInit>);
  /** A fetch implementation to use instead of the global fetch. */
  fetch?: typeof fetch;
}

/**
 * Connect to a DuckDB server over an HTTP REST interface.
 * @param options Connector options.
 * @param options.uri The URI for the DuckDB REST server.
 * @param options.headers Request headers, or a function that returns them
 *  before each request.
 * @param options.fetch A fetch implementation to use instead of the global
 *  fetch.
 * @returns A connector instance.
 */
export function restConnector(options?: RestOptions) {
  return new RestConnector(options);
}

export class RestConnector implements Connector {
  private _uri: string;
  private _headers: RestOptions['headers'];
  private _fetch: RestOptions['fetch'];

  constructor({
    uri = 'http://localhost:3000/',
    headers,
    fetch
  }: RestOptions = {}) {
    this._uri = uri;
    this._headers = headers;
    this._fetch = fetch;
  }

  async query(query: ArrowQueryRequest, options?: ConnectorQueryOptions): Promise<ArrayBuffer>;
  async query(query: ExecQueryRequest, options?: ConnectorQueryOptions): Promise<void>;
  async query(query: ConnectorQueryRequest, { signal }: ConnectorQueryOptions = {}): Promise<unknown> {
    signal?.throwIfAborted();
    const init = typeof this._headers === 'function' ? this._headers() : this._headers;
    const headers = new Headers(
      await (signal ? abortable(Promise.resolve(init), signal) : init)
    );
    signal?.throwIfAborted();
    headers.set('Content-Type', 'application/json');

    // native fetch throws "Illegal invocation" when called as a method of another object
    const fetchImpl = this._fetch ?? fetch;
    const res = await fetchImpl(this._uri, {
      method: 'POST',
      mode: 'cors',
      credentials: 'omit',
      headers,
      body: JSON.stringify(query),
      signal
    });

    if (!res.ok) {
      throw new Error(`Query failed with HTTP status ${res.status}: ${await res.text()}`);
    }

    return query.type === 'exec' ? undefined : res.arrayBuffer();
  }
}
