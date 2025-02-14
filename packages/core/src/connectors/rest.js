import { decodeIPC } from '../util/decode-ipc.js';

export function restConnector(uri = 'http://localhost:3000/') {
  return {
    /**
     * Query the DuckDB server.
     * @param {object} query
     * @param {'exec' | 'arrow' | 'json' | 'create-bundle' | 'load-bundle'} [query.type] The query type.
     * @param {string} [query.sql] A SQL query string.
     * @param {string[]} [query.queries] The queries used to create a bundle.
     * @param {string} [query.name] The name of a bundle to create or load.
     * @returns the query result
     */
    async query(query) {
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
        : query.type === 'arrow' ? decodeIPC(await res.arrayBuffer())
        : res.json();
    }
  };
}
