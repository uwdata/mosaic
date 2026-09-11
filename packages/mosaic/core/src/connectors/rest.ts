import type { ExtractionOptions, Table } from '@uwdata/flechette';
import type {
  ArrowQueryRequest,
  Connector,
  ConnectorRequest,
  ExecQueryRequest,
  PreaggRequest,
  PreaggResponse
} from './Connector.js';
import { decodeIPC } from '../util/decode-ipc.js';
import { ConnectorError, parseErrorResponse } from './errors.js';

interface RestOptions {
  uri?: string;
  ipc?: ExtractionOptions;
}

function errorFromResponse(status: number, contentType: string | null, body: string): ConnectorError {
  if (/^application\/json\s*(;|$)/i.test(contentType?.trim() ?? '')) {
    try {
      const err = parseErrorResponse(JSON.parse(body), status);
      if (err) return err;
    } catch {
      // fall through to the generic error
    }
  }
  return new ConnectorError(`Query failed with HTTP status ${status}: ${body}`, { status });
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
  async query(query: PreaggRequest): Promise<PreaggResponse>;
  async query(query: ConnectorRequest): Promise<unknown> {
    const res = await fetch(this._uri, {
      method: 'POST',
      mode: 'cors',
      credentials: 'omit',
      headers: {
        'Content-Type': 'application/json',
        ...(query.type === 'preagg' ? { Accept: 'application/json' } : {})
      },
      body: JSON.stringify(query)
    });

    if (!res.ok) {
      throw errorFromResponse(res.status, res.headers.get('Content-Type'), await res.text());
    }

    return query.type === 'exec' ? undefined
      : query.type === 'preagg' ? res.json()
      : decodeIPC(await res.arrayBuffer(), this._ipc);
  }
}
