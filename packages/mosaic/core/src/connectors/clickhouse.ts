import type {
  ArrowQueryRequest,
  Connector,
  ConnectorQueryOptions,
  ConnectorQueryRequest,
  ExecQueryRequest
} from './Connector.js';
import { abortable } from '../util/abort.js';

interface ClickHouseOptions {
  uri?: string;
  database?: string;
  user?: string;
  password?: string;
  headers?: HeadersInit | (() => HeadersInit | Promise<HeadersInit>);
  settings?: Record<string, string | number | boolean>;
  fetch?: typeof fetch;
}

export class ClickHouseConnector implements Connector {
  private _uri: string;
  private _database?: string;
  private _user?: string;
  private _password?: string;
  private _headers: ClickHouseOptions['headers'];
  private _settings: NonNullable<ClickHouseOptions['settings']>;
  private _fetch: ClickHouseOptions['fetch'];

  constructor({
    uri = 'http://localhost:8123/',
    database,
    user,
    password,
    headers,
    settings = {},
    fetch
  }: ClickHouseOptions = {}) {
    this._uri = uri;
    this._database = database;
    this._user = user;
    this._password = password;
    this._headers = headers;
    this._settings = settings;
    this._fetch = fetch;
  }

  async query(query: ArrowQueryRequest, options?: ConnectorQueryOptions): Promise<ArrayBuffer>;
  async query(query: ExecQueryRequest, options?: ConnectorQueryOptions): Promise<void>;
  async query({ type, sql }: ConnectorQueryRequest, { signal }: ConnectorQueryOptions = {}): Promise<unknown> {
    signal?.throwIfAborted();
    const init = typeof this._headers === 'function' ? this._headers() : this._headers;
    const headers = new Headers(
      await (signal ? abortable(Promise.resolve(init), signal) : init)
    );
    signal?.throwIfAborted();
    if (this._user != null) headers.set('X-ClickHouse-User', this._user);
    if (this._password != null) headers.set('X-ClickHouse-Key', this._password);

    const params = new URLSearchParams({
      // without this, an error raised mid-stream follows a 200 status
      wait_end_of_query: '1',
      output_format_arrow_compression_method: 'none'
    });
    if (type === 'arrow') params.set('default_format', 'ArrowStream');
    for (const [key, value] of Object.entries(this._settings)) {
      params.set(key, String(value));
    }
    if (this._database) params.set('database', this._database);

    const res = await (this._fetch ?? fetch)(withParams(this._uri, params), {
      method: 'POST',
      mode: 'cors',
      credentials: 'omit',
      headers,
      body: sql,
      signal
    });
    if (!res.ok) {
      throw new Error(`ClickHouse query failed with HTTP status ${res.status}: ${await res.text()}`);
    }
    if (type === 'exec') {
      await res.text();
      return;
    }
    return res.arrayBuffer();
  }
}

function withParams(uri: string, params: URLSearchParams): string {
  const end = uri.includes('#') ? uri.indexOf('#') : uri.length;
  const start = uri.indexOf('?');
  const search = start >= 0 && start < end;
  const merged = new URLSearchParams(search ? uri.slice(start + 1, end) : '');
  for (const [key, value] of params) merged.set(key, value);
  return `${uri.slice(0, search ? start : end)}?${merged}${uri.slice(end)}`;
}
