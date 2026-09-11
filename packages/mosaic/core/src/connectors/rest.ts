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
import { ConnectorError, errorFromEnvelope } from './errors.js';

interface RestOptions {
  uri?: string;
  ipc?: ExtractionOptions;
}

function isJSONContentType(contentType: string | null): boolean {
  return /^application\/json\s*(;|$)/i.test(contentType?.trim() ?? '');
}

function errorFromResponseBody(status: number, contentType: string | null, body: string): ConnectorError {
  if (isJSONContentType(contentType)) {
    try {
      const err = errorFromEnvelope(JSON.parse(body), status);
      if (err) return err;
    } catch {
      // fall through to the generic error
    }
  }
  return new ConnectorError(body || `Request failed with HTTP status ${status}`, { status });
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
      const body = await res.text();
      if (query.type === 'preagg') {
        throw errorFromResponseBody(res.status, res.headers.get('Content-Type'), body);
      }
      throw new Error(`Query failed with HTTP status ${res.status}: ${body}`);
    }

    return query.type === 'exec' ? undefined
      : query.type === 'preagg' ? res.json()
      : decodeIPC(await res.arrayBuffer(), this._ipc);
  }
}
