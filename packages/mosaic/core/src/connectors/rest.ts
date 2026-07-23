import type { ExtractionOptions, Table } from '@uwdata/flechette';
import type { ArrowQueryRequest, Connector, ExecQueryRequest, JSONQueryRequest, ConnectorQueryRequest } from './Connector.js';
import { annotateByteLength, decodeIPC } from '../util/decode-ipc.js';

interface RestOptions {
  uri?: string;
  ipc?: ExtractionOptions;
}

/**
 * Connect to a DuckDB server over an HTTP REST interface.
 * @param options Connector options.
 * @param options.uri The URI for the DuckDB REST server.
 * @param options.ipc Arrow IPC extraction options.
 * @returns A connector instance.
 */
export function restConnector(options?: RestOptions) {
  return new RestConnector(options);
}

export class RestConnector implements Connector {
  private _uri: string;
  private _ipc?: ExtractionOptions;

  constructor({
    uri = 'http://localhost:3000/',
    ipc = undefined
  }: RestOptions = {}) {
    this._uri = uri;
    this._ipc = ipc;
  }

  async query(query: ArrowQueryRequest): Promise<Table>;
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

    if (query.type === 'exec') return req;
    if (query.type === 'arrow') return decodeIPC(await res.arrayBuffer(), this._ipc);
    
    const text = await res.text();
    //This allows for an exact size measurement by using TextEncoder to read length
    return annotateByteLength(JSON.parse(text), utf8Bytes(text));
  }
}

/**
 * Helper function to find size of a stringified JSON response.
 * @param s The stringified response.
 * @returns The byte length of `s` when encoded as UTF-8.
 */
function utf8Bytes(s: string): number {
  const byteSize = new TextEncoder().encode(s).length;
  return byteSize;
}