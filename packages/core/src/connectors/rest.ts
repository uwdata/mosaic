import type { ExtractionOptions } from '@uwdata/flechette';
import type { Connector } from './Connector.js';
import { decodeIPC } from '../util/decode-ipc.js';

/**
 * Connect to a DuckDB server over an HTTP REST interface.
 * @param options Connector options.
 * @param options.uri The URI for the DuckDB REST server.
 * @param options.ipc Arrow IPC extraction options.
 * @returns A connector instance.
 */
export function restConnector({
  uri = 'http://localhost:3000/',
  ipc = undefined,
}: {
  uri?: string;
  ipc?: ExtractionOptions;
} = {}): Connector {
  return {
    async query(query: any): Promise<any> {
      const req = fetch(uri, {
        method: 'POST',
        mode: 'cors',
        cache: 'no-cache',
        credentials: 'omit',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(query)
      });

      const res = await req;

      if (!res.ok) {
        throw new Error(`Query failed with HTTP status ${res.status}: ${await res.text()}`);
      }

      return query.type === 'exec' ? req
        : query.type === 'arrow' ? decodeIPC(await res.arrayBuffer(), ipc)
        : res.json();
    }
  };
}