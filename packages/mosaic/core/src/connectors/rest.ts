import type { ArrowQueryRequest, Connector, ExecQueryRequest, JSONQueryRequest, ConnectorQueryRequest } from './Connector.js';

interface RestOptions {
  uri?: string;
}

/**
 * Connect to a DuckDB server over an HTTP REST interface.
 * @param options Connector options.
 * @param options.uri The URI for the DuckDB REST server.
 * @returns A connector instance.
 */
export function restConnector(options?: RestOptions) {
  return new RestConnector(options);
}

export class RestConnector implements Connector {
  private _uri: string;

  constructor({
    uri = 'http://localhost:3000/'
  }: RestOptions = {}) {
    this._uri = uri;
  }

  async query(query: ArrowQueryRequest): Promise<ArrayBuffer>;
  async query(query: ExecQueryRequest): Promise<void>;
  async query(query: JSONQueryRequest): Promise<Record<string, unknown>[]>;
  async query(query: ConnectorQueryRequest): Promise<unknown> {
    const req = fetch(this._uri, {
      method: 'POST',
      mode: 'cors',
      credentials: 'omit',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(query)
    });

    const res = await req;

    if (!res.ok) {
      throw new Error(`Query failed with HTTP status ${res.status}: ${await res.text()}`);
    }

    return query.type === 'exec' ? req
      : query.type === 'arrow' ? res.arrayBuffer()
      : res.json();
  }
}